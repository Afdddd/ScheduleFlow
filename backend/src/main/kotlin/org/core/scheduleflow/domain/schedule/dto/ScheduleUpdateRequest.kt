package org.core.scheduleflow.domain.schedule.dto

import org.core.scheduleflow.domain.schedule.constant.ScheduleType
import java.time.LocalDate

data class ScheduleUpdateRequest(
    val title: String?,
    val startDate: LocalDate?,
    val endDate: LocalDate?,
    val scheduleType: ScheduleType?,
    val projectId: Long?,
    val memberIds: List<Long>?
)
