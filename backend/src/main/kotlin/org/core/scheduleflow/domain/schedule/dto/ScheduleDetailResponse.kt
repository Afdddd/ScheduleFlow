package org.core.scheduleflow.domain.schedule.dto

import org.core.scheduleflow.domain.schedule.constant.ScheduleType
import org.core.scheduleflow.domain.schedule.entity.Schedule
import java.time.LocalDate

data class ScheduleDetailResponse(
    val id: Long,
    val title: String,
    val startDate: LocalDate,
    val endDate: LocalDate,
    val type: ScheduleType,
    val projectId: Long?,
    val members: List<ScheduleMemberDto>
) {
    companion object {
        fun from(schedule: Schedule): ScheduleDetailResponse {
            return ScheduleDetailResponse(
                schedule.id!!,
                schedule.title,
                schedule.startDate,
                schedule.endDate,
                schedule.type,
                schedule.project?.id,
                schedule.members.map { ScheduleMemberDto.from(it) }
            )
        }
    }
}
