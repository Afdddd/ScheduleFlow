package org.core.scheduleflow.domain.schedule.dto

import org.core.scheduleflow.domain.schedule.constant.ScheduleType
import java.time.LocalDate

data class ScheduleCreateRequest(
    val title: String,
    val startDate: LocalDate,
    val endDate: LocalDate,
    val scheduleType: ScheduleType? = null,
    val projectId: Long? = null,
    val memberIds: List<Long>? = null
)