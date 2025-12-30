package org.core.scheduleflow.domain.file.repository


import org.core.scheduleflow.domain.file.entity.FileEntity
import org.springframework.data.jpa.repository.JpaRepository

interface FileRepository: JpaRepository<FileEntity, Long> {

    fun findByProjectId(projectId: Long): List<FileEntity>
}