package org.core.scheduleflow.domain.project.dto

import org.core.scheduleflow.domain.project.constant.ProjectStatus
import java.time.LocalDate

data class ProjectUpdateRequest(
    val name: String? = null,
    val clientId: Long? = null,
    val status: ProjectStatus? = null,
    val startDate: LocalDate? = null,
    val endDate: LocalDate? = null,
    val description: String? = null,
    val colorCode: String? = null,
    val memberIds: List<Long>? = null,
    val partnerContactIds: List<Long>? = null,
    val scheduleIds: List<Long>? = null
)
