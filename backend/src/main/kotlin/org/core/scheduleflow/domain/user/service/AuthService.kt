package org.core.scheduleflow.domain.user.service

import org.core.scheduleflow.domain.user.constant.Role
import org.core.scheduleflow.domain.user.dto.TokenRefreshRequest
import org.core.scheduleflow.domain.user.dto.TokenResponse
import org.core.scheduleflow.domain.user.dto.UserSignInRequest
import org.core.scheduleflow.domain.user.dto.UserSignUpRequest
import org.core.scheduleflow.domain.user.entity.User
import org.core.scheduleflow.domain.user.repository.UserRepository
import org.core.scheduleflow.global.exception.CustomException
import org.core.scheduleflow.global.exception.ErrorCode
import org.core.scheduleflow.global.security.jwt.JwtProvider
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class AuthService(
    private val passwordEncoder: PasswordEncoder,
    private val userRepository: UserRepository,
    private val authenticationManager: AuthenticationManager,
    private val jwtProvider: JwtProvider
) {

    @Transactional
    fun signUp(request: UserSignUpRequest): Long {
        if(userRepository.existsByUsername(request.username))
            throw CustomException(ErrorCode.DUPLICATE_USERNAME)

        val user = User(
            username = request.username,
            password = passwordEncoder.encode(request.password)!!,
            name = request.name,
            email = request.email,
            phone = request.phone
        )

        return userRepository.save(user).id!!
    }


    @Transactional(readOnly = true)
    fun signIn(request: UserSignInRequest): TokenResponse {
        authenticateUser(request)
        val user = userRepository.findByUsername(request.username)
            ?: throw CustomException(ErrorCode.NOT_FOUND_USER)
        val userId = checkNotNull(user.id) {
            "findByUsername() 후에는 userId가 DB에 존재해야한다."
        }
        return issueTokens(userId, user.username, user.userRole)
    }

    /**
     * 리프레시 토큰으로 새 토큰 쌍을 발급한다(로테이션 — 리프레시도 매번 새로 발급해 만료를 연장).
     * 사용자 존재 여부를 다시 확인하므로 삭제된 계정의 리프레시 토큰은 여기서 걸러진다.
     */
    @Transactional(readOnly = true)
    fun refresh(request: TokenRefreshRequest): TokenResponse {
        val claims = jwtProvider.parseRefreshClaims(request.refreshToken)
            ?: throw CustomException(ErrorCode.INVALID_REFRESH_TOKEN)
        val user = userRepository.findByUsername(claims.subject)
            ?: throw CustomException(ErrorCode.INVALID_REFRESH_TOKEN)
        val userId = checkNotNull(user.id) {
            "findByUsername() 후에는 userId가 DB에 존재해야한다."
        }
        return issueTokens(userId, user.username, user.userRole)
    }

    private fun issueTokens(userId: Long, username: String, role: Role): TokenResponse {
        return TokenResponse(
            accessToken = jwtProvider.generateAccessToken(userId, username, role),
            refreshToken = jwtProvider.generateRefreshToken(userId, username, role)
        )
    }

    private fun authenticateUser(request: UserSignInRequest) {
        runCatching {
            authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken(request.username, request.password)
            )
        }.onFailure { throw CustomException(ErrorCode.INVALID_CREDENTIALS) }
    }
}