package org.core.scheduleflow.domain.project.dto

import org.core.scheduleflow.domain.project.constant.ProjectStatus
import java.time.LocalDate

data class ProjectListResponse(
    val id: Long,
    val name: String,
    val clientName: String,
    val status: ProjectStatus?,
    val startDate: LocalDate,
    val endDate: LocalDate,
    val colorCode: String?
)
