package org.core.scheduleflow.domain.file.dto

import org.core.scheduleflow.domain.file.constant.FileCategory
import java.time.LocalDateTime

data class FileListResponse(
    val id: Long,
    val originalFileName: String,        // 원본 파일명
    val projectName: String?,            // 프로젝트 이름 (null 가능)
    val uploaderName: String,            // 업로더 이름
    val category: FileCategory,                // 파일 카테고리
    val fileSize: Long,                  // 파일 크기 (bytes)
    val contentType: String,             // MIME 타입
    val createdAt: LocalDateTime                // 업로드 일시 (yyyy-MM-dd HH:mm:ss)
)