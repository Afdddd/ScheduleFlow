package org.core.scheduleflow.domain.file.service

import org.core.scheduleflow.domain.file.constant.FileCategory
import org.core.scheduleflow.domain.file.dto.FileListResponse
import org.core.scheduleflow.domain.file.dto.FileResponse
import org.core.scheduleflow.domain.file.entity.FileEntity
import org.core.scheduleflow.domain.file.repository.FileRepository
import org.core.scheduleflow.domain.file.storage.FileStorage
import org.core.scheduleflow.domain.project.repository.ProjectRepository
import org.core.scheduleflow.domain.user.repository.UserRepository
import org.core.scheduleflow.global.exception.CustomException
import org.core.scheduleflow.global.exception.ErrorCode
import org.springframework.core.io.Resource
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.repository.findByIdOrNull
import org.springframework.http.HttpHeaders
import org.springframework.http.ResponseEntity
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.util.UriUtils
import java.nio.charset.StandardCharsets

import java.util.UUID
import kotlin.String


@Service
class FileService(
    private val fileRepository: FileRepository,
    private val projectRepository: ProjectRepository,
    private val userRepository: UserRepository,
    private val fileStorage: FileStorage,
) {
    @Transactional(readOnly = true)
    fun findFiles(pageable: Pageable, keyword: String?): Page<FileListResponse> {
        if(!keyword.isNullOrBlank()) {
            return fileRepository.findByFileName(pageable, keyword)
        }
        return fileRepository.findFiles(pageable)
    }

    @Transactional(readOnly = true)
    fun findByProjectId(projectId: Long): List<FileResponse> {
        val files = fileRepository.findByProjectId(projectId)
        if (files.isEmpty()) return emptyList()
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
        val originalFileName = file.originalFilename ?: "unknown"
        val extension = originalFileName.substringAfterLast(".", "")
        val storedName = "${UUID.randomUUID()}.$extension"
        val key = "${category.name}/$storedName"
        fileStorage.store(key, file)
        val uploadFile = fileRepository.save(FileEntity(
            project = projectRepository.findByIdOrNull(projectId) ?: throw CustomException(ErrorCode.NOT_FOUND_PROJECT),
            user = userRepository.findByIdOrNull(userId) ?: throw CustomException(ErrorCode.NOT_FOUND_USER),
            category = category,
            storedFileName = storedName,
            originalFileName = originalFileName,
            filePath = key,
            fileSize = file.size,
            contentType = file.contentType.toString(),
        ))
        return FileResponse.fromEntity(uploadFile)
    }

    fun downloadFile(fileId: Long): ResponseEntity<Resource> {
        val file = getFileById(fileId)
        if (file.category != FileCategory.PHOTO && !hasAdminRole()) {
            throw CustomException(ErrorCode.PERMISSION_DENIED)
        }
        val resource = fileStorage.loadAsResource(file.filePath)
        if(!resource.exists() || !resource.isReadable) throw CustomException(ErrorCode.NOT_FOUND_FILE)
        val encodedFileName = UriUtils.encode(file.originalFileName, StandardCharsets.UTF_8)
        val contentDisposition = "attachment; filename=\"$encodedFileName\""
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_TYPE, file.contentType)
            .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition)
            .contentLength(file.fileSize)
            .body(resource)
    }

    fun getFileById(fileId: Long): FileEntity =
        fileRepository.findByIdOrNull(fileId) ?: throw CustomException(ErrorCode.NOT_FOUND_FILE)

    private fun hasAdminRole(): Boolean =
        SecurityContextHolder.getContext().authentication?.authorities
            ?.any { it.authority == "ROLE_ADMIN" } ?: false

    @Transactional
    fun deleteFile(fileId: Long) {
        val file = getFileById(fileId)
        fileStorage.delete(file.filePath)
        fileRepository.delete(file)
    }
}