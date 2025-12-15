package org.core.scheduleflow.domain.user.dto

data class UserSignInRequest(
    val username: String,
    val password: String
)