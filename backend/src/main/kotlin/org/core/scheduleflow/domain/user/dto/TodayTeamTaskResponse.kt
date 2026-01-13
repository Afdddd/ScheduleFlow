package org.core.scheduleflow.domain.user.dto

data class TodayTeamTaskResponse(
    val userId: Long,
    val memberName: String,
    val scheduleTitle: String?,
    val projectTitle: String?,
    val projectColorCode: String?
)