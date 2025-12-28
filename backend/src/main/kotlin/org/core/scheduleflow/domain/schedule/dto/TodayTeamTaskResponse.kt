package org.core.scheduleflow.domain.schedule.dto

data class TodayTeamTaskResponse(
    val memberName: String,
    val scheduleTitle: String,
    val projectTitle: String,
    val projectColorCode: String?
)
