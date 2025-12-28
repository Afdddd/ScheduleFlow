package org.core.scheduleflow.domain.schedule.dto

import org.core.scheduleflow.domain.schedule.constant.ScheduleType
import org.core.scheduleflow.domain.schedule.entity.Schedule
import java.time.LocalDate

data class ScheduleCalenderResponse(
    val scheduleId: Long,
    val title: String,
    val startDate: LocalDate,
    val endDate: LocalDate,
    val type: ScheduleType?,
) {
    companion object{
        fun from(schedule: Schedule): ScheduleCalenderResponse {
            return ScheduleCalenderResponse(
                scheduleId = schedule.id!!,
                title = schedule.title,
                startDate = schedule.startDate,
                endDate = schedule.endDate,
                type = schedule.type
            )
        }
    }
}
