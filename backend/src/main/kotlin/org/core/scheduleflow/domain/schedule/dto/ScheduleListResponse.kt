package org.core.scheduleflow.domain.schedule.dto

import org.core.scheduleflow.domain.schedule.constant.ScheduleType
import org.core.scheduleflow.domain.schedule.entity.Schedule
import java.time.LocalDate

data class ScheduleListResponse(
    val id: Long,
    val title: String,
    val projectName: String?,
    val type: ScheduleType,
    val startDate: LocalDate,
    val endDate: LocalDate,
    val memberNames: List<String>,
) {
    companion object {
        fun from(schedule: Schedule, memberNames: List<String>) = ScheduleListResponse(
            id = schedule.id!!,
            title = schedule.title,
            projectName = schedule.project?.name,
            type = schedule.type,
            startDate = schedule.startDate,
            endDate = schedule.endDate,
            memberNames = memberNames,
        )
    }
}
