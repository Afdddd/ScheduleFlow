package org.core.scheduleflow.domain.user.dto

data class UserResponse(
    val id: Long,
    val name: String,
    val phone: String,
    val email: String?,
    val position: String?
)
