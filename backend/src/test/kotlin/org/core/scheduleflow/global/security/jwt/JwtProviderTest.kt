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
    @DisplayName("정상 액세스 토큰은 Authentication을 반환한다")
    fun getAuthentication_validToken_returnsAuthentication() {
        // given
        val token = jwtProvider.generateAccessToken(1L, "testUser", Role.STAFF)

        // when
        val authentication = jwtProvider.getAuthentication(token)

        // then
        assertNotNull(authentication)
        assertTrue(authentication!!.authorities.any { it.authority == "ROLE_STAFF" })
    }

    @Test
    @DisplayName("위조된 토큰은 예외 대신 null을 반환한다")
    fun getAuthentication_invalidToken_returnsNull() {
        // given
        val invalidToken = "this.is.invalid.token"

        // when & then: 예외를 던지지 않고 null — 필터가 인증을 세팅하지 않아 401로 이어짐
        assertNull(jwtProvider.getAuthentication(invalidToken))
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
