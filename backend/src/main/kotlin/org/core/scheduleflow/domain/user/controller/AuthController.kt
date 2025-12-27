package org.core.scheduleflow.domain.user.controller

import jakarta.validation.Valid
import org.core.scheduleflow.domain.user.dto.UserSignInRequest
import org.core.scheduleflow.domain.user.dto.UserSignUpRequest
import org.core.scheduleflow.domain.user.service.AuthService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/auth")
class AuthController(
    private val authService: AuthService
) {

    @PostMapping("/sign-up")
    fun signUp(@RequestBody @Valid request: UserSignUpRequest): ResponseEntity<Long> {
        return ResponseEntity.status(HttpStatus.CREATED).body(
            authService.signUp(request)
        )
    }

    @PostMapping("/sign-in")
    fun signIn(@RequestBody request: UserSignInRequest): ResponseEntity<String> {
        return ResponseEntity.ok(authService.signIn(request))
    }


}