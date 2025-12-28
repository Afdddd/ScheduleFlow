package org.core.scheduleflow.domain.project.dto

import org.core.scheduleflow.domain.project.entity.Project
import org.core.scheduleflow.domain.schedule.dto.ScheduleCalenderResponse

data class ProjectCalendarWithSchedulesResponse(
    val project: ProjectCalendarResponse,
    val schedules: List<ScheduleCalenderResponse>
) {
    companion object {
        fun from(project: Project): ProjectCalendarWithSchedulesResponse {
            return ProjectCalendarWithSchedulesResponse(
                project = ProjectCalendarResponse.from(project),
                schedules = project.schedules.map { schedule ->
                    ScheduleCalenderResponse.from(schedule)
                }
            )
        }
    }
}
