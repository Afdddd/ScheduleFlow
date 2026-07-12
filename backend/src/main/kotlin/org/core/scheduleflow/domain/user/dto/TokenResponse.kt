package org.core.scheduleflow.domain.user.dto

data class TokenResponse(
    val accessToken: String,
    val refreshToken: String
)
