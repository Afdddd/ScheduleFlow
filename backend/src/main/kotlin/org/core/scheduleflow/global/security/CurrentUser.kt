package org.core.scheduleflow.global.security

import io.jsonwebtoken.Claims
import org.core.scheduleflow.domain.user.constant.Role
import org.core.scheduleflow.global.exception.CustomException
import org.core.scheduleflow.global.exception.ErrorCode

/**
 * 인증된 사용자 정보. 컨트롤러에서 JWT 클레임으로부터 만들어 서비스에 전달한다.
 * (서비스가 SecurityContext에 직접 의존하지 않게 해 단위 테스트를 쉽게 유지)
 */
data class CurrentUser(
    val userId: Long,
    val username: String,
    val role: Role
) {
    val isAdmin: Boolean get() = role == Role.ADMIN

    companion object {
        fun from(claims: Claims): CurrentUser {
            val userId = (claims["userId"] as? Number)?.toLong()
                ?: throw CustomException(ErrorCode.INVALID_ACCESS_TOKEN)
            val username = claims.subject
                ?: throw CustomException(ErrorCode.INVALID_ACCESS_TOKEN)
            val role = claims.get("role", String::class.java)
                ?.let { name -> Role.entries.find { it.name == name } }
                ?: throw CustomException(ErrorCode.INVALID_ACCESS_TOKEN)
            return CurrentUser(userId, username, role)
        }
    }
}
