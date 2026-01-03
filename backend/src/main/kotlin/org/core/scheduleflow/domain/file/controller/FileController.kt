package org.core.scheduleflow.domain.file.controller

import org.core.scheduleflow.domain.file.constant.FileCategory
import org.core.scheduleflow.domain.file.dto.FileResponse
import org.core.scheduleflow.domain.file.service.FileService
import org.springframework.core.io.UrlResource
import org.springframework.http.ResponseEntity
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

    @GetMapping("/{partnerId}")
    fun findByProjectId(@PathVariable partnerId: Long): List<FileResponse>{
        return fileService.findByProjectId(partnerId)
    }

    @PostMapping("/{projectId}/upload")
    fun uploadFile(
        @PathVariable projectId: Long,
        @RequestParam("category") category: FileCategory,
        @RequestPart("file") file: MultipartFile,
        @AuthenticationPrincipal claims: io.jsonwebtoken.Claims
    ): ResponseEntity<FileResponse> {
        val userId = (claims["userId"] as Number).toLong()

        val response : FileResponse = fileService.uploadFile(projectId, file, category, userId)

        return ResponseEntity.ok(response)
    }

    @GetMapping("/download/{fileId}")
    fun downloadFile(@PathVariable fileId: Long): ResponseEntity<UrlResource>{
        return fileService.downloadFile(fileId)
    }

    @DeleteMapping("/delete/{fileId}")
    fun deleteFile(@PathVariable fileId: Long): ResponseEntity<Unit>{
        fileService.deleteFile(fileId)

        return ResponseEntity.noContent().build()
    }

}