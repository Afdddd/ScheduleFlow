package org.core.scheduleflow.domain.file.controller

import org.core.scheduleflow.domain.file.constant.FileCategory
import org.core.scheduleflow.domain.file.dto.FileListResponse
import org.core.scheduleflow.domain.file.dto.FileResponse
import org.core.scheduleflow.domain.file.service.FileService
import org.core.scheduleflow.global.dto.PageResponse
import org.core.scheduleflow.global.exception.CustomException
import org.core.scheduleflow.global.exception.ErrorCode
import org.springframework.core.io.UrlResource
import org.springframework.data.domain.Pageable
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RequestPart
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile

@RestController
@RequestMapping("/file")
class FileController(
    private val fileService: FileService
) {

    @GetMapping("/{projectId}")
    fun findByProjectId(@PathVariable projectId: Long): List<FileResponse>{
        return fileService.findByProjectId(projectId)
    }

    @GetMapping
    fun findFiles(
        @RequestParam(required = false) keyword: String?,
        @RequestParam page: Int,
        @RequestParam size: Int
    ): PageResponse<FileListResponse> {

        val pageable: Pageable = Pageable.ofSize(size).withPage(page)

        val files = fileService.findFiles(pageable, keyword)


        return PageResponse.from(files)
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{projectId}/upload")
    fun uploadFile(
        @PathVariable projectId: Long,
        @RequestParam("category") category: FileCategory,
        @RequestPart("file") file: MultipartFile,
        @AuthenticationPrincipal claims: io.jsonwebtoken.Claims
    ): ResponseEntity<FileResponse> {
        val userId = (claims["userId"] as? Number)?.toLong() ?: throw CustomException(ErrorCode.NOT_FOUND_USER)

        val response : FileResponse = fileService.uploadFile(projectId, file, category, userId)

        return ResponseEntity.ok(response)
    }

    @GetMapping("/download/{fileId}")
    fun downloadFile(@PathVariable fileId: Long): ResponseEntity<UrlResource>{
        return fileService.downloadFile(fileId)
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/delete/{fileId}")
    fun deleteFile(@PathVariable fileId: Long): ResponseEntity<Unit>{
        fileService.deleteFile(fileId)

        return ResponseEntity.noContent().build()
    }

}