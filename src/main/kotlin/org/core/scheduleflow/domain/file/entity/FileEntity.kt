package org.core.scheduleflow.domain.file.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import org.core.scheduleflow.domain.file.constant.FileCategory
import org.core.scheduleflow.domain.project.entity.Project
import org.core.scheduleflow.domain.user.entity.User
import org.core.scheduleflow.global.entity.BaseEntity

@Entity
@Table(name = "files")
class FileEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    var project: Project,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    var user: User,

    @Enumerated(EnumType.STRING)
    val category: FileCategory,

    @Column(name = "stored_file_name", nullable = false)
    var storedFileName: String,

    @Column(name = "original_file_name", nullable = false)
    var originalFileName: String,

    @Column(name = "file_path", nullable = false)
    var filePath: String,

    @Column(name = "file_size", nullable = false)
    var fileSize: Long,

    @Column(name = "content_type", nullable = false)
    var contentType: String,
    ): BaseEntity()