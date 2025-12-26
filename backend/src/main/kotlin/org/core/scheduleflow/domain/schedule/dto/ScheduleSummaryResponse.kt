package org.core.scheduleflow.domain.schedule.dto

import org.core.scheduleflow.domain.schedule.constant.ScheduleType
import org.core.scheduleflow.domain.schedule.entity.Schedule

data class ScheduleSummaryResponse(
    val id: Long,
    val title: String,
    val startDate: String,
    val endDate: String,
    val type: ScheduleType,
) {
    companion object{
        fun from(schedule: Schedule): ScheduleSummaryResponse {
            return ScheduleSummaryResponse(
                id = schedule.id!!,
                title = schedule.title,
                startDate = schedule.startDate.toString(),
                endDate = schedule.endDate.toString(),
                type = schedule.type
            )
        }
    }
}