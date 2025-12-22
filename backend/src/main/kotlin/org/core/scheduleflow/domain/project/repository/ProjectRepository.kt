package org.core.scheduleflow.domain.project.repository

import org.core.scheduleflow.domain.project.entity.Project
import org.springframework.data.jpa.repository.JpaRepository

interface ProjectRepository: JpaRepository<Project, Long>, ProjectRepositoryCustom {
    fun existsByName(name: String): Boolean
}

interface ProjectRepositoryCustom {
    fun findByIdWithClient(projectId: Long): Project?
    fun findAllWithClient(): List<Project>
}