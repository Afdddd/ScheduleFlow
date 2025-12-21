package org.core.scheduleflow.domain.project.dto

import org.core.scheduleflow.domain.project.constant.ProjectStatus
import org.core.scheduleflow.domain.project.entity.Project
import java.time.LocalDate

data class ProjectSummaryResponse(
    val id: Long,
    val name: String,
    val status: ProjectStatus,
    val startDate: LocalDate,
    val endDate: LocalDate,
    val client: String,
    val memberNames: List<String>
){
    companion object{
        fun from(project: Project, memberNames: List<String>): ProjectSummaryResponse {
            return ProjectSummaryResponse(
                id = project.id!!,
                name = project.name,
                status = project.status,
                startDate = project.startDate,
                endDate = project.endDate,
                client = project.client.companyName,
                memberNames = memberNames
            )
        }
    }
}
