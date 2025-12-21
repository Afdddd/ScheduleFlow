package org.core.scheduleflow.domain.schedule.dto

import org.core.scheduleflow.domain.schedule.constant.ScheduleType
import org.core.scheduleflow.domain.schedule.entity.Schedule

data class ProjectScheduleDto(
    val scheduleId: Long,
    val title: String,
    val type: ScheduleType,
    val startDate: String,
    val endDate: String,
    val memberNames: List<String>
) {
    companion object{
        fun from(schedule: Schedule, memberNames: List<String>): ProjectScheduleDto {
            return ProjectScheduleDto(
                scheduleId = schedule.id!!,
                title = schedule.title,
                type = schedule.type,
                startDate = schedule.startDate.toString(),
                endDate = schedule.endDate.toString(),
                memberNames = memberNames
            )
        }
    }
}