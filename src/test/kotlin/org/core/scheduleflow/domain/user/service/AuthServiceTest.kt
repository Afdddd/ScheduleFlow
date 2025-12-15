package org.core.scheduleflow.domain.user.service

import org.core.scheduleflow.domain.user.dto.UserSignInRequest
import org.core.scheduleflow.domain.user.dto.UserSignUpRequest
import org.core.scheduleflow.domain.user.repository.UserRepository
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.transaction.annotation.Transactional

@SpringBootTest
@Transactional
@ActiveProfiles("test")
class AuthServiceTest {

    @Autowired
    lateinit var authService: AuthService

    @Autowired
    lateinit var userRepository: UserRepository

    @Test
    @DisplayName("회원가입 성공")
    fun signUp_success() {
        // Given
        val request = UserSignUpRequest(
            username = "newuser",
            password = "password",
            name = "New User",
            email = "new@example.com",
            phone = "010-0000-0000"
        )

        // When
        val userId = authService.signUp(request)

        // Then
        assertNotNull(userId)
        assertTrue(userRepository.existsByUsername("newuser"))
    }

    @Test
    @DisplayName("회원가입 실패 - 중복된 username")
    fun signUp_fail_duplicate_username() {
        // Given
        val request = UserSignUpRequest(
            username = "duplicate",
            password = "password",
            name = "User1",
            phone = "010-1111-1111"
        )
        authService.signUp(request)

        // When & Then
        assertThrows<RuntimeException> {
            authService.signUp(request)
        }
    }

    @Test
    @DisplayName("로그인 성공 - 토큰 발행")
    fun signIn_success() {
        // Given (회원가입 시켜놓고)
        val signUpRequest = UserSignUpRequest(
            username = "loginuser",
            password = "password123",
            name = "Login User",
            phone = "010-2222-2222"
        )
        authService.signUp(signUpRequest)

        val signInRequest = UserSignInRequest(
            username = "loginuser",
            password = "password123"
        )

        // When
        val token = authService.signIn(signInRequest)

        // Then
        assertNotNull(token)
        assertTrue(token.length > 10) // 토큰이 뭔가 발급됐는지 확인
    }

    @Test
    @DisplayName("로그인 실패 - 비밀번호 틀림")
    fun signIn_fail_invalid_password() {
        // Given
        val signUpRequest = UserSignUpRequest(
            username = "failuser",
            password = "correctPassword",
            name = "Fail User",
            phone = "010-3333-3333"
        )
        authService.signUp(signUpRequest)

        val signInRequest = UserSignInRequest(
            username = "failuser",
            password = "wrongPassword" // 틀린 비번
        )

        // When & Then
        assertThrows<RuntimeException> {
            authService.signIn(signInRequest)
        }
    }

}