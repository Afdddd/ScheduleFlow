package org.core.scheduleflow.domain.file.repository


import org.core.scheduleflow.domain.file.dto.FileListResponse
import org.core.scheduleflow.domain.file.entity.FileEntity
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

interface FileRepository: JpaRepository<FileEntity, Long> {


    @Query("""
    SELECT new org.core.scheduleflow.domain.file.dto.FileListResponse(
        f.id, 
        f.originalFileName, 
        p.name, 
        u.name, 
        f.category, 
        f.fileSize, 
        f.contentType, 
        f.createdAt
    ) 
    FROM FileEntity f
    JOIN f.user u 
    LEFT JOIN f.project p """)
    fun findFiles(pageable: Pageable): Page<FileListResponse>

    @Query("""
    SELECT new org.core.scheduleflow.domain.file.dto.FileListResponse(
        f.id, 
        f.originalFileName, 
        p.name, 
        u.name, 
        f.category, 
        f.fileSize, 
        f.contentType, 
        f.createdAt) 
    FROM FileEntity f
    JOIN f.user u 
    LEFT JOIN f.project p
    WHERE f.originalFileName LIKE CONCAT('%', :keyword, '%')
    """)
    fun findByFileName(pageable: Pageable, keyword: String): Page<FileListResponse>

    fun findByProjectId(projectId: Long): List<FileEntity>
}