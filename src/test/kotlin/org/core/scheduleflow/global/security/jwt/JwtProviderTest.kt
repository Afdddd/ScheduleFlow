package org.core.scheduleflow.global.security.jwt

import org.core.scheduleflow.domain.user.constant.Role
import org.core.scheduleflow.global.exception.CustomException
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows

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
        val token = jwtProvider.generateAccessToken("testUser", Role.STAFF)

        // when
        val result = jwtProvider.validateToken(token)

        // then
        assertTrue(result.isSuccess)
        assertTrue(result.getOrThrow())
    }

    @Test
    @DisplayName("위조된 토큰은 조회 실패")
    fun validateToken_invalidToken_fail() {
        // given
        val invalidToken = "this.is.invalid.token"

        //when & then
        assertThrows<CustomException> { jwtProvider.validateToken(invalidToken) }
    }

}