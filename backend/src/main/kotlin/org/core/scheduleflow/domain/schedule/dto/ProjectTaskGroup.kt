package org.core.scheduleflow.domain.schedule.dto

data class ProjectTaskGroup(
    val projectId: Long,
    val projectTitle: String,
    val colorCode: String?,
    val tasks: List<MyTaskResponse>
)
