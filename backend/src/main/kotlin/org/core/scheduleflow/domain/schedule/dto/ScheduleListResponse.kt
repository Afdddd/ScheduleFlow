package org.core.scheduleflow.domain.schedule.dto

import org.core.scheduleflow.domain.schedule.constant.ScheduleType
import java.time.LocalDate

data class ScheduleListResponse(
    val id: Long,
    val title: String,
    val projectName: String?,
    val type: ScheduleType,
    val startDate: LocalDate,
    val endDate: LocalDate,
)
