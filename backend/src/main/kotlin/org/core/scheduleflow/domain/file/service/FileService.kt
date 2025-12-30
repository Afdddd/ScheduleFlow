package org.core.scheduleflow.domain.file.service

import jakarta.annotation.PostConstruct
import org.core.scheduleflow.domain.file.constant.FileCategory
import org.core.scheduleflow.domain.file.dto.FileResponse
import org.core.scheduleflow.domain.file.entity.FileEntity
import org.core.scheduleflow.domain.file.repository.FileRepository
import org.core.scheduleflow.domain.project.repository.ProjectRepository
import org.core.scheduleflow.domain.user.repository.UserRepository
import org.core.scheduleflow.global.exception.CustomException
import org.core.scheduleflow.global.exception.ErrorCode
import org.springframework.beans.factory.annotation.Value
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import java.io.IOException
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
    fun findByProjectId(partnerId: Long): List<FileResponse> {

        val files = fileRepository.findByProjectId(partnerId)

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
            contentType = file.contentType.toString(),
        ))
        
        return FileResponse.fromEntity(uploadFile)
    }




}