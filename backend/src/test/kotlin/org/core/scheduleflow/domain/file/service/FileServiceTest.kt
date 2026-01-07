package org.core.scheduleflow.domain.file.service

import jakarta.transaction.Transactional
import org.assertj.core.api.Assertions.assertThat
import org.core.scheduleflow.domain.file.constant.FileCategory
import org.core.scheduleflow.domain.file.repository.FileRepository
import org.core.scheduleflow.domain.partner.entity.Partner
import org.core.scheduleflow.domain.partner.repository.PartnerRepository
import org.core.scheduleflow.domain.project.entity.Project
import org.core.scheduleflow.domain.project.entity.ProjectMember
import org.core.scheduleflow.domain.project.repository.ProjectRepository
import org.core.scheduleflow.domain.user.entity.User
import org.core.scheduleflow.domain.user.repository.UserRepository
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.data.domain.Pageable
import org.springframework.http.HttpStatus
import org.springframework.mock.web.MockMultipartFile
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.context.TestConstructor
import java.io.File
import java.nio.file.Files
import java.nio.file.Paths
import java.time.LocalDate
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue


@SpringBootTest
@ActiveProfiles("test")
@Transactional
@TestConstructor(autowireMode = TestConstructor.AutowireMode.ALL)
class FileServiceTest(
    private val fileService: FileService,
    private val fileRepository: FileRepository,
    private val projectRepository: ProjectRepository, // 가상의 프로젝트 저장소
    private val userRepository: UserRepository,       // 가상의 유저 저장소
    private val partnerRepository: PartnerRepository
) {
    @Value("\${storage.path}")
    private lateinit var testUploadPath: String

    // 테스트용 데이터 미리 준비
    lateinit var testProject: Project
    lateinit var testUser: User

    @BeforeEach
    fun setUp() {
        // 1. 테스트용 폴더 생성
        Files.createDirectories(Paths.get(testUploadPath))

        // 2. 외래키 제약을 위한 기본 데이터 저장

        fun createPartner(companyName: String = "발주처"): Partner {
            return Partner(
                // id = id,
                companyName = companyName,
                mainPhone = "02-1234-5678"
            )
        }

        fun createUser( username: String, name: String): User {
            return User(
                // id = id,
                username = username,
                name = name,
                password = "password",
                phone = "010-0000-0000"
            )
        }

        fun createProjectWithSavedMembers(
            // id: Long,
            name: String,
            client: Partner,
            users: List<User>,
            startDate: LocalDate = LocalDate.now(),
            endDate: LocalDate = LocalDate.now().plusDays(30),
            description: String? = null,
            colorCode: String? = null
        ): Project {
                val project = Project(
                    name = name,
                    client = client,
                    startDate = startDate,
                    endDate = endDate,
                    description = description,
                    colorCode = colorCode
                )

                // ID를 수동으로 할당하지 않고 관계만 맺어줍니다.
                val members = users.map { user ->
                    ProjectMember(
                        project = project,
                        user = user
                    )
                }
                project.members.clear()
                project.members.addAll(members)

                return project
            }

                val client = partnerRepository.save(createPartner())
                // Partner와 User를 먼저 저장하여 영속 상태로 만듭니다.
                // 만약 projectRepository.save 시 CascadeType.PERSIST가 설정되어 있지 않다면 에러가 날 수 있습니다.
                val user = userRepository.save(createUser("user1", "홍길동"))

                val project = createProjectWithSavedMembers(
                    name = "프로젝트",
                    client = client, // 이제 client는 DB에 저장된 영속 상태입니다.
                    users = listOf(user)
                )

                testProject = projectRepository.save(project)
            testUser = user
        }

    @AfterEach
    fun tearDown() {
        // 테스트 종료 후 생성된 물리 파일 및 폴더 삭제
        val targetDir = File(testUploadPath)
        targetDir.deleteRecursively()
    }

    @Test
    @DisplayName("파일 업로드 테스트: DB에 저장되고 물리 파일이 생성되어야 한다")
    fun uploadFileTest() {
        // Given
        val content = "Hello, World!".toByteArray()
        val file = MockMultipartFile(
            "file",
            "test_document.txt",
            "text/plain",
            content
        )
        val category = FileCategory.QUOTATION

        // When
        val response = fileService.uploadFile(
            testProject.id!! , file, category, userId = testUser.id!!
        )

        // Then
        // 1. DB 저장 확인
        val savedFile = fileRepository.findById(response.id!!).orElseThrow()

        assertEquals("test_document.txt", savedFile.originalFileName)
        assertEquals(FileCategory.QUOTATION, savedFile.category)

        // 2. 물리 파일 존재 확인
        val physicalFile = File(savedFile.filePath)
        // assertThat(physicalFile.exists()).isTrue()
        assertTrue(physicalFile.exists(), "물리 파일이 디스크에 존재하지 않습니다.")

    }

    @Test
    @DisplayName("파일 삭제 테스트: DB 정보와 물리 파일이 모두 삭제되어야 한다")
    fun deleteFileTest() {
        // Given: 먼저 파일을 하나 업로드함
        val file = MockMultipartFile("file", "delete_me.txt", "text/plain", "content".toByteArray())
        val uploaded = fileService.uploadFile(
            testProject.id!!, file, FileCategory.DRAWING, testUser.id!!
        )
        val filePath = uploaded.filePath

        // When
        fileService.deleteFile(uploaded.id!!)

        // Then
        // 1. DB 삭제 확인
        val existsInDb = fileRepository.existsById(uploaded.id!!)

        // assertThat(existsInDb).isFalse()
        assertFalse(existsInDb, "DB에 데이터가 여전히 남아있습니다.")

        // 2. 물리 파일 삭제 확인
        val physicalFile = File(filePath)
        // assertThat(physicalFile.exists()).isFalse()
        assertFalse(physicalFile.exists(), "물리 파일이 디스크에 존재합니다.")
    }

    @Test
    @DisplayName("파일 다운로드 테스트: 저장된 파일을 Resource로 읽어와야 한다")
    fun downloadFileTest() {
        // Given
        val content = "Download Content".toByteArray()
        val file = MockMultipartFile("file", "download.txt", "text/plain", content)
        val uploaded = fileService.uploadFile(testProject.id!!, file, FileCategory.BOM, testUser.id!!)

        // When
        val responseEntity = fileService.downloadFile(uploaded.id!!)

        // Then
        // assertThat(responseEntity.statusCode).isEqualTo(HttpStatus.OK)
        // assertThat(responseEntity.body!!.exists()).isTrue()
        // assertThat(responseEntity.headers.contentDisposition.filename).isEqualTo("download.txt")
        // 1. 상태 코드 확인: assertEquals(기대값, 실제값)
        assertEquals(HttpStatus.OK, responseEntity.statusCode)

        // 2. 파일 존재 여부 확인: assertTrue(조건)
        assertTrue(responseEntity.body!!.exists(), "다운로드할 리소스가 존재해야 합니다.")

        // 3. 파일 이름 확인: assertEquals(기대값, 실제값)
        assertEquals("download.txt", responseEntity.headers.contentDisposition.filename)
    }

    @Test
    @DisplayName("페이징 처리 조회")
    fun pagingTest(){
        // Given
        val content = "Download Content".toByteArray()
        val file1 = MockMultipartFile("file1", "download.txt", "text/plain", content)
        val file2 = MockMultipartFile("file2", "test_download.txt", "text/plain", content)
        val file3 = MockMultipartFile("file3", "test.txt", "text/plain", content)
        val uploaded1 = fileService.uploadFile(testProject.id!!, file1, FileCategory.BOM, testUser.id!!)
        val uploaded2 = fileService.uploadFile(testProject.id!!, file2, FileCategory.BOM, testUser.id!!)
        val uploaded3 = fileService.uploadFile(testProject.id!!, file3, FileCategory.BOM, testUser.id!!)

        // When
        val pageable = Pageable.ofSize(5)
        val found1 = fileService.findFiles(pageable, null)
        val found2 = fileService.findFiles(pageable, "download")

        // Then


        assertThat(found1.content.size).isEqualTo(3)
        assertThat(found2.content.size).isEqualTo(2)
    }
}