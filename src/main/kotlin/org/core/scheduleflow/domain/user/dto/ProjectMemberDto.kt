package org.core.scheduleflow.domain.user.dto

import org.core.scheduleflow.domain.project.entity.ProjectMembers

data class ProjectMemberDto(
    val id: Long,
    val name: String,
    val position: String,
) {
    companion object {
        fun from(projectMember: ProjectMembers): ProjectMemberDto {
            return ProjectMemberDto(
                id = projectMember.id!!,
                name = projectMember.user.name,
                position = projectMember.user.position ?: ""
            )
        }
    }
}
