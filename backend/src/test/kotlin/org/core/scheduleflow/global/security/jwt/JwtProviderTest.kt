package org.core.scheduleflow.global.security.jwt

import org.core.scheduleflow.domain.user.constant.Role
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test

class JwtProviderTest {

    private lateinit var jwtProvider: JwtProvider
    private val secretKey = "dGVzdC1zZWNyZXQta2V5LXRlc3Qtc2VjcmV0LWtleS10ZXN0LXNlY3JldC1rZXk="
    private val expiration = 60_000L

    @BeforeEach
    fun setUp() {
        jwtProvider = JwtProvider(secretKey, expiration)
    }

    @Test
    @DisplayName("정상 토큰을 반환한다.")
    fun validateToken_validToken_success() {
        // given
        val token = jwtProvider.generateAccessToken(1L, "testUser", Role.STAFF)

        // when
        val result = jwtProvider.validateToken(token)

        // then
        assertTrue(result.isSuccess)
        assertTrue(result.getOrThrow())
    }

    @Test
    @DisplayName("위조된 토큰은 검증 실패(Result.failure)를 반환한다")
    fun validateToken_invalidToken_fail() {
        // given
        val invalidToken = "this.is.invalid.token"

        // when
        val result = jwtProvider.validateToken(invalidToken)

        // then: 예외를 던지지 않고 실패 Result를 돌려준다(필터가 삼키고 401로 이어짐)
        assertTrue(result.isFailure)
    }

}