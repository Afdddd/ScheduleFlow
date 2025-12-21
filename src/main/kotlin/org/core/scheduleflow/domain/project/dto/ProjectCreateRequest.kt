package org.core.scheduleflow.domain.project.dto

import org.core.scheduleflow.domain.project.constant.ProjectStatus
import java.time.LocalDate

data class ProjectCreateRequest(
    val name: String,
    val clientId: Long,
    val partnerContactIds: List<Long>,
    val memberIds: List<Long>,
    val status: ProjectStatus? = ProjectStatus.IN_PROGRESS,
    val startDate: LocalDate,
    val endDate: LocalDate,
    val description: String? = null,
    val colorCode: String? = null
)
