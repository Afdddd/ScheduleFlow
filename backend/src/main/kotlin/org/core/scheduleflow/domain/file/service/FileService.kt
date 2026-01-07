package org.core.scheduleflow.domain.file.service

import jakarta.annotation.PostConstruct
import org.core.scheduleflow.domain.file.constant.FileCategory
import org.core.scheduleflow.domain.file.dto.FileListResponse
import org.core.scheduleflow.domain.file.dto.FileResponse
import org.core.scheduleflow.domain.file.entity.FileEntity
import org.core.scheduleflow.domain.file.repository.FileRepository
import org.core.scheduleflow.domain.project.repository.ProjectRepository
import org.core.scheduleflow.domain.user.repository.UserRepository
import org.core.scheduleflow.global.exception.CustomException
import org.core.scheduleflow.global.exception.ErrorCode
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.core.io.UrlResource
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.repository.findByIdOrNull
import org.springframework.http.HttpHeaders
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.util.UriUtils
import java.io.IOException
import java.nio.charset.StandardCharsets
import java.nio.file.Files

import java.nio.file.Paths
import java.nio.file.StandardCopyOption
import java.util.UUID
import kotlin.String


@Service
class FileService(
    private val fileRepository: FileRepository,
    @Value("\${storage.path}") private val uploadPath: String,
    private val projectRepository: ProjectRepository,
    private val userRepository: UserRepository,

) {
    private val logger = LoggerFactory.getLogger(this.javaClass)

    private val rootLocation = Paths.get(uploadPath).toAbsolutePath().normalize()

    @PostConstruct
    fun init() {
        try {
            Files.createDirectories(rootLocation)
        } catch (e: IOException) {
            throw RuntimeException("루트 폴더를 생성할 수 없습니다.", e)
        }
    }

    @Transactional(readOnly = true)
    fun findByFileName(pageable: Pageable, keyword: String?): Page<FileListResponse> {

        if(!keyword.isNullOrBlank()) {
            return fileRepository.findByFileName(pageable, keyword)
        }

        return fileRepository.findFiles(pageable)
    }

    @Transactional(readOnly = true)
    fun findByProjectId(projectId: Long): List<FileResponse> {

        val files = fileRepository.findByProjectId(projectId)

        if (files.isEmpty()) {
            return emptyList()
        }

        return files.map { partner ->
            partner.let { FileResponse.fromEntity(it) }
        }
    }

    @Transactional
    fun uploadFile(
        projectId: Long,
        file: MultipartFile,
        category: FileCategory,
        userId: Long
    ): FileResponse {

        /* 카테고리별 디렉토리 조회하여 없으면 생성 */
        val fileLocation = rootLocation.resolve(category.name).normalize()
        if (!Files.exists(fileLocation)) {
            Files.createDirectories(fileLocation)
        }

        val originalFileName = file.originalFilename ?: "unknown"
        val extension = originalFileName.substringAfterLast(".", "")
        val storedName = "${UUID.randomUUID()}.$extension"
        val destinationFile = fileLocation.resolve(storedName)
        
        /* 물리저장 */
        file.inputStream.use { inputStream ->
            Files.copy(inputStream, destinationFile, StandardCopyOption.REPLACE_EXISTING)
        }
        
        /* 메타 데이터 저장 */
        val uploadFile = fileRepository.save(FileEntity(
            project = projectRepository.findByIdOrNull(projectId) ?: throw CustomException(ErrorCode.NOT_FOUND_PROJECT),
            user = userRepository.findByIdOrNull(userId) ?: throw CustomException(ErrorCode.NOT_FOUND_USER),
            category = category,
            storedFileName = storedName,
            originalFileName = originalFileName,
            filePath = destinationFile.toString(),
            fileSize = file.size,
            contentType = file.contentType.toString() ?: "application/octet-stream",
        ))
        
        return FileResponse.fromEntity(uploadFile)
    }

    @Transactional
    fun downloadFile(fileId: Long): ResponseEntity<UrlResource> {
        val downloadFile = fileRepository.findByIdOrNull(fileId) ?: throw CustomException(ErrorCode.NOT_FOUND_FILE)

        val filePath = Paths.get(downloadFile.filePath)
        val resource = UrlResource(filePath.toUri())

        if(!resource.exists() || !resource.isReadable) throw CustomException(ErrorCode.NOT_FOUND_FILE)

        val encodedFileName = UriUtils.encode(downloadFile.originalFileName, StandardCharsets.UTF_8)

        val contentDisposition = "attachment; filename=\"$encodedFileName\""

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_TYPE, downloadFile.contentType)
            .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition)
            .contentLength(downloadFile.fileSize)
            .body(resource)

    }

    @Transactional
    fun deleteFile(fileId: Long) {
        val deleteFile = fileRepository.findByIdOrNull(fileId) ?: throw CustomException(ErrorCode.NOT_FOUND_FILE)

        val filePath = Paths.get(deleteFile.filePath)

        try {
            val isDeleted = Files.deleteIfExists(filePath)

            if(isDeleted) {
                // 로그용
                logger.info("파일 삭제 완료 : {}", deleteFile.filePath)
            } else {
                // 로그용
                logger.warn("파일이 존재하지 않아 삭제되지 않았습니다 : {}", deleteFile.filePath)
            }

        } catch (e: IOException) {

            logger.error("파일 삭제 중 I/O 오류 발생: {}", deleteFile.filePath, e)
            throw CustomException(ErrorCode.FAIL_DELETE_FILE)

        }

        fileRepository.delete(deleteFile)
    }


}