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
    private val refreshExpiration = 120_000L

    @BeforeEach
    fun setUp() {
        jwtProvider = JwtProvider(secretKey, expiration, refreshExpiration)
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

    @Test
    @DisplayName("리프레시 토큰은 parseRefreshClaims로 클레임을 얻을 수 있다")
    fun parseRefreshClaims_refreshToken_returnsClaims() {
        // given
        val refreshToken = jwtProvider.generateRefreshToken(1L, "testUser", Role.STAFF)

        // when
        val claims = jwtProvider.parseRefreshClaims(refreshToken)

        // then
        assertNotNull(claims)
        assertEquals("testUser", claims!!.subject)
    }

    @Test
    @DisplayName("액세스 토큰은 parseRefreshClaims에서 거부된다(null)")
    fun parseRefreshClaims_accessToken_returnsNull() {
        // given
        val accessToken = jwtProvider.generateAccessToken(1L, "testUser", Role.STAFF)

        // when & then: 액세스 토큰으로 refresh 엔드포인트를 두드려도 통하지 않아야 한다
        assertNull(jwtProvider.parseRefreshClaims(accessToken))
    }

    @Test
    @DisplayName("리프레시 토큰은 API 인증 수단으로 쓸 수 없다(getAuthentication null)")
    fun getAuthentication_refreshToken_returnsNull() {
        // given
        val refreshToken = jwtProvider.generateRefreshToken(1L, "testUser", Role.STAFF)

        // when & then
        assertNull(jwtProvider.getAuthentication(refreshToken))
    }
}
