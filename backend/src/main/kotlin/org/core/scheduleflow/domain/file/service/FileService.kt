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

    @Transactional
    fun downloadFile(fileId: Long): ResponseEntity<Resource> {
        val file = fileRepository.findByIdOrNull(fileId) ?: throw CustomException(ErrorCode.NOT_FOUND_FILE)

        // 문서 카테고리(견적서·회로도·PLC 등)는 ADMIN만 다운로드할 수 있다.
        // 현장 사진(PHOTO)만 인증된 사용자 누구나 받을 수 있다 — 업로드 권한 분기와 대칭.
        // (미적용 시 저권한 사용자가 fileId 순회로 기밀문서를 전량 내려받는 IDOR 발생)
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

    private fun hasAdminRole(): Boolean =
        SecurityContextHolder.getContext().authentication?.authorities
            ?.any { it.authority == "ROLE_ADMIN" } ?: false

    @Transactional
    fun deleteFile(fileId: Long) {
        val file = fileRepository.findByIdOrNull(fileId) ?: throw CustomException(ErrorCode.NOT_FOUND_FILE)
        fileStorage.delete(file.filePath)
        fileRepository.delete(file)
    }
}