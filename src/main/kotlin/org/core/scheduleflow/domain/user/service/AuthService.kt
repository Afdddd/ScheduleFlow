package org.core.scheduleflow.domain.user.service

import org.core.scheduleflow.domain.user.dto.UserSignInRequest
import org.core.scheduleflow.domain.user.dto.UserSignUpRequest
import org.core.scheduleflow.domain.user.entity.User
import org.core.scheduleflow.domain.user.repository.UserRepository
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
            throw RuntimeException("Username already exists")

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
    fun signIn(request: UserSignInRequest): String {
        authenticateUser(request)
        val user = userRepository.findByUsername(request.username)
            ?: throw RuntimeException("Not found user with username: ${request.username}")
        return jwtProvider.generateAccessToken(user.username, user.userRole )
    }

    private fun authenticateUser(request: UserSignInRequest) {
        runCatching {
            authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken(request.username, request.password)
            )
        }.onFailure { throw RuntimeException("Invalid ID or Password") }
    }
}