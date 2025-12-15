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
        username: String,
        role: Role,
        extraClaims: Map<String, Any> = emptyMap()
    ): String {

        val now = Date()
        val expiry = Date(now.time + expiration)

        val claims = mutableMapOf<String, Any>()
        claims.putAll(extraClaims)
        claims["role"] = role.name

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

        val username = claims.subject
        val role = claims.get("role", String::class.java)
        val authorities = listOf(SimpleGrantedAuthority("ROLE_$role"))
        return UsernamePasswordAuthenticationToken(username, null, authorities)
    }

    fun validateToken(token: String): Result<Boolean> {
        try{
            Jwts.parser()
                .verifyWith(getSecurityKey(secretKey))
                .build()
                .parseSignedClaims(token)
            return Result.success(true)
        }catch (e: Exception){
            return Result.failure(e)
        }
    }


    private fun getSecurityKey(secretKey: String): SecretKey {
        val ketBytes =
            Decoders.BASE64.decode(secretKey)
        return Keys.hmacShaKeyFor(ketBytes)
    }
}