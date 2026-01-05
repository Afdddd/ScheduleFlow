package org.core.scheduleflow.domain.file.dto

import org.core.scheduleflow.domain.file.constant.FileCategory
import org.core.scheduleflow.domain.file.entity.FileEntity


data class FileResponse(
    val id: Long?,
    val projectId: Long?,
    val userId: Long?,
    val category: FileCategory?,
    val storedFileName: String,
    val originalFileName: String,
    val filePath: String,
    val fileSize: Long,
    val contentType: String

){
    companion object {
        fun fromEntity(file: FileEntity): FileResponse {
            return FileResponse(
                id = file.id,
                projectId = file.project.id,
                userId = file.user.id,
                category = file.category,
                storedFileName = file.storedFileName,
                originalFileName = file.originalFileName,
                filePath = file.filePath,
                fileSize = file.fileSize,
                contentType = file.contentType,
            )
        }
    }
}