package org.core.scheduleflow.domain.schedule.dto

import org.core.scheduleflow.domain.schedule.constant.ScheduleType
import java.time.LocalDate

data class MyTaskResponse(
    val scheduleId: Long,
    val scheduleTitle: String,
    val projectTitle: String,
    val scheduleStartDate: LocalDate,
    val scheduleEndDate: LocalDate,
    val colorCode: String?,
    val scheduleType: ScheduleType
)