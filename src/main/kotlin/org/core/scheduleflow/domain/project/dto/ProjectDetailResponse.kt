package org.core.scheduleflow.domain.project.dto

import org.core.scheduleflow.domain.partner.dto.ClientInfoDto
import org.core.scheduleflow.domain.partner.dto.ProjectPartnerContactDto
import org.core.scheduleflow.domain.project.constant.ProjectStatus
import org.core.scheduleflow.domain.project.entity.Project
import org.core.scheduleflow.domain.schedule.dto.ProjectScheduleDto
import org.core.scheduleflow.domain.user.dto.ProjectMemberDto
import java.time.LocalDate

data class ProjectDetailResponse(
    val id: Long,
    val name: String,
    val status: ProjectStatus,
    val description: String?,
    val startDate: LocalDate,
    val endDate: LocalDate,
    val colorCode: String?,
    val client: ClientInfoDto,
    val partnerContacts: List<ProjectPartnerContactDto>,
    val members: List<ProjectMemberDto>,
    val schedules: List<ProjectScheduleDto>
) {
    companion object {
        fun from(
            project: Project,
            contacts: List<ProjectPartnerContactDto>,
            members: List<ProjectMemberDto>,
            schedules: List<ProjectScheduleDto>
        ): ProjectDetailResponse {
            return ProjectDetailResponse(
                id = project.id!!,
                name = project.name,
                status = project.status,
                description = project.description,
                startDate = project.startDate,
                endDate = project.endDate,
                colorCode = project.colorCode,
                client = ClientInfoDto.from(project.client),
                partnerContacts = contacts,
                members = members,
                schedules = schedules
            )
        }
    }
}
