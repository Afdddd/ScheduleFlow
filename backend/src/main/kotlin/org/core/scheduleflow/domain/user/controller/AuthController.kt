package org.core.scheduleflow.domain.user.controller

import jakarta.validation.Valid
import org.core.scheduleflow.domain.user.dto.TokenRefreshRequest
import org.core.scheduleflow.domain.user.dto.TokenResponse
import org.core.scheduleflow.domain.user.dto.UserSignInRequest
import org.core.scheduleflow.domain.user.dto.UserSignUpRequest
import org.core.scheduleflow.domain.user.service.AuthService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/auth")
class AuthController(
    private val authService: AuthService
) {

    // 내부 ~10명 고정 사용자 도구. 셀프 가입은 막고 ADMIN이 계정을 발급한다.
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/sign-up")
    fun signUp(@RequestBody @Valid request: UserSignUpRequest): ResponseEntity<Long> {
        return ResponseEntity.status(HttpStatus.CREATED).body(
            authService.signUp(request)
        )
    }

    @PostMapping("/sign-in")
    fun signIn(@RequestBody request: UserSignInRequest): ResponseEntity<TokenResponse> {
        return ResponseEntity.ok(authService.signIn(request))
    }

    // 액세스 토큰 만료 시 리프레시 토큰으로 새 토큰 쌍을 발급받는다(자동 로그인).
    @PostMapping("/refresh")
    fun refresh(@RequestBody @Valid request: TokenRefreshRequest): ResponseEntity<TokenResponse> {
        return ResponseEntity.ok(authService.refresh(request))
    }


}