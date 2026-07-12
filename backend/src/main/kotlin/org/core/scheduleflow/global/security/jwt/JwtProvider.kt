package org.core.scheduleflow.global.security.jwt

import io.jsonwebtoken.Claims
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.io.Decoders
import io.jsonwebtoken.security.Keys
import org.core.scheduleflow.domain.user.constant.Role
import org.springframework.beans.factory.annotation.Value
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.Authentication
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.stereotype.Service
import java.util.Date
import javax.crypto.SecretKey

@Service
class JwtProvider(
    @Value("\${jwt.secret-key}") private val secretKey: String,
    @Value("\${jwt.expiration}") private val expiration: Long,
    @Value("\${jwt.refresh-expiration}") private val refreshExpiration: Long
){
    companion object {
        private const val CLAIM_TYPE = "type"
        private const val TYPE_REFRESH = "refresh"
    }

    fun generateAccessToken(
        userId: Long,
        username: String,
        role: Role,
        extraClaims: Map<String, Any> = emptyMap()
    ): String {
        val claims = mutableMapOf<String, Any>()
        claims.putAll(extraClaims)
        claims["role"] = role.name
        claims["userId"] = userId

        return buildToken(claims, username, expiration)
    }

    // 리프레시 토큰은 type=refresh 클레임으로 구분한다.
    // 상태 저장 없이 서명·만료만 검증하는 방식 — 탈취 대응(서버측 무효화)은 포기하는 트레이드오프.
    fun generateRefreshToken(userId: Long, username: String, role: Role): String {
        val claims = mutableMapOf<String, Any>(
            CLAIM_TYPE to TYPE_REFRESH,
            "role" to role.name,
            "userId" to userId
        )
        return buildToken(claims, username, refreshExpiration)
    }

    /**
     * 리프레시 토큰을 검증하고 클레임을 돌려준다.
     * 서명/만료가 유효하고 type=refresh인 경우에만 클레임 반환, 아니면 null.
     */
    fun parseRefreshClaims(token: String): Claims? {
        val claims = parseClaims(token) ?: return null
        return if (claims[CLAIM_TYPE] == TYPE_REFRESH) claims else null
    }

    /**
     * 액세스 토큰으로부터 Authentication을 만든다. 검증·파싱은 여기서 1회만 수행한다.
     *
     * 다음 경우 예외 대신 null을 반환한다:
     * - 서명/만료가 유효하지 않은 토큰
     * - 리프레시 토큰(type=refresh) — API 인증 수단으로 쓸 수 없다
     *
     * null이면 필터가 인증을 세팅하지 않고, 이후 authenticated() 단계에서
     * JwtAuthenticationEntryPoint가 일관된 401을 반환한다(→ 프론트 로그인 리다이렉트).
     * (예외를 던지면 필터 밖으로 새어나가 @RestControllerAdvice가 못 잡고 500성 응답이 됨)
     */
    fun getAuthentication(token: String): Authentication? {
        val claims = parseClaims(token) ?: return null
        if (claims[CLAIM_TYPE] == TYPE_REFRESH) return null

        val role = claims.get("role", String::class.java)
        val authorities = listOf(SimpleGrantedAuthority("ROLE_$role"))
        return UsernamePasswordAuthenticationToken(claims, null, authorities)
    }

    private fun buildToken(claims: Map<String, Any>, subject: String, ttlMillis: Long): String {
        val now = Date()
        return Jwts.builder()
            .claims(claims)
            .subject(subject)
            .issuedAt(now)
            .expiration(Date(now.time + ttlMillis))
            .signWith(getSecurityKey(secretKey), Jwts.SIG.HS256)
            .compact()
    }

    private fun parseClaims(token: String): Claims? {
        return try {
            Jwts.parser()
                .verifyWith(getSecurityKey(secretKey))
                .build()
                .parseSignedClaims(token)
                .payload
        } catch (e: Exception) {
            null
        }
    }

    private fun getSecurityKey(secretKey: String): SecretKey {
        val ketBytes =
            Decoders.BASE64.decode(secretKey)
        return Keys.hmacShaKeyFor(ketBytes)
    }
}
