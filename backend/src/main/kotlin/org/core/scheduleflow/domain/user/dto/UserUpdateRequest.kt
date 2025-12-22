package org.core.scheduleflow.domain.user.dto

data class UserUpdateRequest(
    val name: String?,
    val phone: String?,
    val position: String?,
    val email: String?
)