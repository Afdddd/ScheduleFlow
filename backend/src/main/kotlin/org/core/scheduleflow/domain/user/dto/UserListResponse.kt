package org.core.scheduleflow.domain.user.dto

import org.core.scheduleflow.domain.user.constant.Role

data class UserListResponse(
    val id: Long,
    val name: String,
    val username: String,
    val email: String?,
    val phone: String,
    val position: String?,
    val role: Role
)
