package org.core.scheduleflow.domain.project.repository

import org.core.scheduleflow.domain.project.entity.Project
import org.core.scheduleflow.domain.project.entity.ProjectMember
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface ProjectMemberRepository: JpaRepository<ProjectMember, Long> {
    @Query("SELECT pm FROM ProjectMember pm JOIN FETCH pm.user WHERE pm.project = :project")
    fun findByProjectWithUser(@Param("project") project: Project): List<ProjectMember>
}