package org.core.scheduleflow.domain.project.repository

import org.core.scheduleflow.domain.project.entity.ProjectMembers
import org.springframework.data.jpa.repository.JpaRepository

interface ProjectMemberRepository: JpaRepository<ProjectMembers, Long> {
}