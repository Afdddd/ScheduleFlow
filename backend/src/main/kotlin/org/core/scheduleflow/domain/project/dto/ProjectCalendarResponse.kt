package org.core.scheduleflow.domain.project.dto

import org.core.scheduleflow.domain.project.constant.ProjectStatus
import org.core.scheduleflow.domain.project.entity.Project
import java.time.LocalDate

data class ProjectCalendarResponse(
    val id: Long,
    val name: String,
    val startDate: LocalDate,
    val endDate: LocalDate,
    val colorCode: String?,
    val status: ProjectStatus?
) {
    companion object{
        fun from(project: Project): ProjectCalendarResponse {
            return ProjectCalendarResponse(
                id = project.id!!,
                name = project.name,
                startDate = project.startDate,
                endDate = project.endDate,
                colorCode = project.colorCode,
                status = project.status
            )
        }
    }
}
