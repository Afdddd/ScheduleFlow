package org.core.scheduleflow.domain.user.dto

data class UserSignUpRequest(
    val username: String,
    val password: String,
    val name: String,
    val email: String? = null,
    val phone: String
)