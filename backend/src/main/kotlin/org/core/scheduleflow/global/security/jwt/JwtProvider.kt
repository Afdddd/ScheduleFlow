package org.core.scheduleflow.global.security.jwt

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
    @Value("\${jwt.expiration}") private val expiration: Long
){
    fun generateAccessToken(
        userId: Long,
        username: String,
        role: Role,
        extraClaims: Map<String, Any> = emptyMap()
    ): String {
        val now = Date()
        val expiry = Date(now.time + expiration)

        val claims = mutableMapOf<String, Any>()
        claims.putAll(extraClaims)
        claims["role"] = role.name
        claims["userId"] = userId

        return Jwts.builder()
            .claims(claims)
            .subject(username)
            .issuedAt(now)
            .expiration(expiry)
            .signWith(getSecurityKey(secretKey), Jwts.SIG.HS256)
            .compact()
    }

    fun getAuthentication(token: String): Authentication {
        val claims = Jwts.parser()
            .verifyWith(getSecurityKey(secretKey))
            .build()
            .parseSignedClaims(token)
            .payload

        val role = claims.get("role", String::class.java)
        val authorities = listOf(SimpleGrantedAuthority("ROLE_$role"))
        return UsernamePasswordAuthenticationToken(claims, null, authorities)
    }

    fun validateToken(token: String): Result<Boolean> {
        // 검증 실패 시 예외를 던지지 않고 Result.failure로 돌려준다.
        // 필터가 이 실패를 삼키고 인증을 세팅하지 않으면, 이후 authenticated() 단계에서
        // JwtAuthenticationEntryPoint가 일관된 401을 반환한다(→ 프론트 로그인 리다이렉트).
        // (예외를 던지면 필터 밖으로 새어나가 @RestControllerAdvice가 못 잡고 500성 응답이 됨)
        return try {
            Jwts.parser()
                .verifyWith(getSecurityKey(secretKey))
                .build()
                .parseSignedClaims(token)
            Result.success(true)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }


    private fun getSecurityKey(secretKey: String): SecretKey {
        val ketBytes =
            Decoders.BASE64.decode(secretKey)
        return Keys.hmacShaKeyFor(ketBytes)
    }
}