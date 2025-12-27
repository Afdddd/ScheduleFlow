package org.core.scheduleflow.domain.user.dto

import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class UserSignUpRequest(
    @field:NotBlank
    val username: String,

    @field:NotBlank
    @field:Size(min = 8, max = 20)
    val password: String,

    @field:NotBlank
    val name: String,

    @field:Email
    val email: String? = null,

    @field:NotBlank
    val phone: String
)