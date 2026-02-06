package org.core.scheduleflow.domain.file.service

import io.kotest.assertions.throwables.shouldThrow
import io.kotest.core.spec.IsolationMode
import io.kotest.core.spec.style.BehaviorSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.string.shouldContain
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkConstructor
import io.mockk.mockkStatic
import io.mockk.unmockkAll
import io.mockk.verify
import org.core.scheduleflow.domain.file.constant.FileCategory
import org.core.scheduleflow.domain.file.dto.FileListResponse
import org.core.scheduleflow.domain.file.entity.FileEntity
import org.core.scheduleflow.domain.file.repository.FileRepository
import org.core.scheduleflow.domain.partner.entity.Partner
import org.core.scheduleflow.domain.project.entity.Project
import org.core.scheduleflow.domain.project.repository.ProjectRepository
import org.core.scheduleflow.domain.user.entity.User
import org.core.scheduleflow.domain.user.repository.UserRepository
import org.core.scheduleflow.global.exception.CustomException
import org.core.scheduleflow.global.exception.ErrorCode
import org.springframework.core.io.UrlResource
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.Pageable
import org.springframework.data.repository.findByIdOrNull
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.web.multipart.MultipartFile
import java.io.InputStream
import java.nio.file.CopyOption
import java.nio.file.Files
import java.nio.file.Path
import java.time.LocalDate
import java.time.LocalDateTime

class FileServiceTest : BehaviorSpec({

    isolationMode = IsolationMode.InstancePerLeaf

    val fileRepository = mockk<FileRepository>()
    val projectRepository = mockk<ProjectRepository>()
    val userRepository = mockk<UserRepository>()
    val uploadPath = "/tmp/test-upload"
    val fileService = FileService(fileRepository, uploadPath, projectRepository, userRepository)

    fun createPartner(id: Long = 1L): Partner {
        return Partner(id = id, companyName = "발주처", mainPhone = "02-1234-5678")
    }

    fun createProject(id: Long = 1L): Project {
        return Project(
            id = id,
            client = createPartner(),
            name = "프로젝트",
            startDate = LocalDate.now(),
            endDate = LocalDate.now().plusDays(30)
        )
    }

    fun createUser(id: Long = 1L): User {
        return User(
            id = id,
            username = "user1",
            password = "password",
            name = "홍길동",
            phone = "010-0000-0000"
        )
    }

    fun createFileEntity(
        id: Long = 1L,
        project: Project,
        user: User,
        originalFileName: String = "test_document.txt",
        category: FileCategory = FileCategory.QUOTATION
    ): FileEntity {
        return FileEntity(
            id = id,
            project = project,
            user = user,
            category = category,
            storedFileName = "uuid-stored.txt",
            originalFileName = originalFileName,
            filePath = "/tmp/test-upload/QUOTATION/uuid-stored.txt",
            fileSize = 13L,
            contentType = "text/plain"
        )
    }

    afterSpec {
        unmockkAll()
    }

    Given("파일 업로드 요청이 주어지고") {
        val project = createProject()
        val user = createUser()
        val mockFile = mockk<MultipartFile>()
        val inputStream = "Hello, World!".byteInputStream()

        every { mockFile.originalFilename } returns "test_document.txt"
        every { mockFile.inputStream } returns inputStream
        every { mockFile.size } returns 13L
        every { mockFile.contentType } returns "text/plain"

        every { projectRepository.findByIdOrNull(1L) } returns project
        every { userRepository.findByIdOrNull(1L) } returns user

        mockkStatic(Files::class)
        every { Files.exists(any()) } returns true
        every { Files.createDirectories(any<Path>()) } returns mockk()
        every { Files.copy(any<InputStream>(), any<Path>(), any<CopyOption>()) } returns 13L

        every { fileRepository.save(any()) } answers {
            val entity = firstArg<FileEntity>()
            FileEntity(
                id = 1L,
                project = entity.project,
                user = entity.user,
                category = entity.category,
                storedFileName = entity.storedFileName,
                originalFileName = entity.originalFileName,
                filePath = entity.filePath,
                fileSize = entity.fileSize,
                contentType = entity.contentType
            )
        }

        When("파일을 업로드하면") {
            val result = fileService.uploadFile(1L, mockFile, FileCategory.QUOTATION, 1L)

            Then("파일 정보가 반환된다") {
                result.originalFileName shouldBe "test_document.txt"
                result.category shouldBe FileCategory.QUOTATION
                verify(exactly = 1) { fileRepository.save(any()) }
                verify(exactly = 1) { projectRepository.findByIdOrNull(1L) }
                verify(exactly = 1) { userRepository.findByIdOrNull(1L) }
            }
        }
    }

    Given("파일 삭제 요청이 주어지고") {
        val project = createProject()
        val user = createUser()
        val fileEntity = createFileEntity(1L, project, user)

        every { fileRepository.findByIdOrNull(1L) } returns fileEntity

        mockkStatic(Files::class)
        every { Files.deleteIfExists(any()) } returns true
        every { fileRepository.delete(fileEntity) } returns Unit

        When("파일을 삭제하면") {
            fileService.deleteFile(1L)

            Then("파일이 삭제된다") {
                verify(exactly = 1) { fileRepository.findByIdOrNull(1L) }
                verify(exactly = 1) { Files.deleteIfExists(any()) }
                verify(exactly = 1) { fileRepository.delete(fileEntity) }
            }
        }
    }

    Given("파일 다운로드 요청이 주어지고") {
        val project = createProject()
        val user = createUser()
        val fileEntity = createFileEntity(1L, project, user, originalFileName = "download.txt")

        every { fileRepository.findByIdOrNull(1L) } returns fileEntity

        mockkConstructor(UrlResource::class)
        every { anyConstructed<UrlResource>().exists() } returns true
        every { anyConstructed<UrlResource>().isReadable } returns true

        When("파일을 다운로드하면") {
            val responseEntity = fileService.downloadFile(1L)

            Then("파일 리소스가 반환된다") {
                responseEntity.statusCode shouldBe HttpStatus.OK
                responseEntity.headers.getFirst(HttpHeaders.CONTENT_DISPOSITION)!! shouldContain "download.txt"
                verify(exactly = 1) { fileRepository.findByIdOrNull(1L) }
            }
        }
    }

    Given("존재하지 않는 파일 다운로드 요청이 주어지고") {
        every { fileRepository.findByIdOrNull(999L) } returns null

        When("다운로드하면") {
            val exception = shouldThrow<CustomException> {
                fileService.downloadFile(999L)
            }

            Then("NOT_FOUND_FILE 예외가 발생한다") {
                exception.errorCode shouldBe ErrorCode.NOT_FOUND_FILE
            }
        }
    }

    Given("파일 목록 조회 요청이 주어지고") {
        val pageable = Pageable.ofSize(5)
        val fileListResponse = FileListResponse(
            id = 1L,
            originalFileName = "download.txt",
            projectName = "프로젝트",
            uploaderName = "홍길동",
            category = FileCategory.BOM,
            fileSize = 100L,
            contentType = "text/plain",
            createdAt = LocalDateTime.now()
        )
        val expectedPage = PageImpl(listOf(fileListResponse), pageable, 1)

        When("키워드가 null이면") {
            every { fileRepository.findFiles(pageable) } returns expectedPage

            val result = fileService.findFiles(pageable, null)

            Then("전체 파일 목록이 조회된다") {
                result.content.size shouldBe 1
                verify(exactly = 1) { fileRepository.findFiles(pageable) }
                verify(exactly = 0) { fileRepository.findByFileName(any(), any()) }
            }
        }

        When("키워드가 주어지면") {
            every { fileRepository.findByFileName(pageable, "download") } returns expectedPage

            val result = fileService.findFiles(pageable, "download")

            Then("키워드로 검색된 파일 목록이 조회된다") {
                result.content.size shouldBe 1
                verify(exactly = 1) { fileRepository.findByFileName(pageable, "download") }
                verify(exactly = 0) { fileRepository.findFiles(any()) }
            }
        }
    }
})
