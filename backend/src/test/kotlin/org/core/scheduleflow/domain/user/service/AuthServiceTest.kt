package org.core.scheduleflow.domain.user.service

import org.core.scheduleflow.domain.user.dto.UserSignInRequest
import org.core.scheduleflow.domain.user.dto.UserSignUpRequest
import org.core.scheduleflow.domain.user.repository.UserRepository
import org.core.scheduleflow.global.exception.CustomException
import org.core.scheduleflow.global.exception.ErrorCode
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
        val exception = assertThrows<CustomException> {
            authService.signUp(request)
        }
        assertEquals(ErrorCode.DUPLICATE_USERNAME, exception.errorCode)
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
        val exception = assertThrows<CustomException> {
            authService.signIn(signInRequest)
        }
        assertEquals(ErrorCode.INVALID_CREDENTIALS, exception.errorCode)
    }

    @Test
    @DisplayName("로그인 실패 - 존재하지 않는 사용자")
    fun signIn_fail_user_not_found() {
        // Given
        val signInRequest = UserSignInRequest(
            username = "nonexistent",
            password = "password123"
        )

        // When & Then
        val exception = assertThrows<CustomException> {
            authService.signIn(signInRequest)
        }
        assertEquals(ErrorCode.INVALID_CREDENTIALS, exception.errorCode)
    }

    @Test
    @DisplayName("회원가입 - 비밀번호 암호화 확인")
    fun signUp_password_encoded() {
        // Given
        val plainPassword = "mySecretPassword"
        val request = UserSignUpRequest(
            username = "encodedUser",
            password = plainPassword,
            name = "Encoded User",
            phone = "010-5555-5555"
        )

        // When
        val userId = authService.signUp(request)

        // Then
        val savedUser = userRepository.findById(userId).orElse(null)
        assertNotNull(savedUser)
        assertNotEquals(plainPassword, savedUser.password) // 평문 비밀번호와 달라야 함
        assertTrue(savedUser.password.length > plainPassword.length) // 암호화되면 길이가 길어짐
    }

}