package org.core.scheduleflow.domain.user.dto

data class TodayTeamTaskGroup(
    val userId: Long,
    val memberName: String,
    val tasks: List<TodayTeamTaskResponse>
)
