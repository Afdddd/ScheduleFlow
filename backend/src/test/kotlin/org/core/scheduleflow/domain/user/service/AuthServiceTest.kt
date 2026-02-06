package org.core.scheduleflow.domain.user.service

import io.kotest.assertions.throwables.shouldThrow
import io.kotest.core.spec.IsolationMode
import io.kotest.core.spec.style.BehaviorSpec
import io.kotest.matchers.shouldBe
import io.mockk.every
import io.mockk.slot
import io.mockk.mockk
import io.mockk.verify
import org.core.scheduleflow.domain.user.constant.Role
import org.core.scheduleflow.domain.user.dto.UserSignInRequest
import org.core.scheduleflow.domain.user.dto.UserSignUpRequest
import org.core.scheduleflow.domain.user.entity.User
import org.core.scheduleflow.domain.user.repository.UserRepository
import org.core.scheduleflow.global.exception.CustomException
import org.core.scheduleflow.global.exception.ErrorCode
import org.core.scheduleflow.global.security.jwt.JwtProvider
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.BadCredentialsException
import org.springframework.security.crypto.password.PasswordEncoder

class AuthServiceTest : BehaviorSpec({

    isolationMode = IsolationMode.InstancePerLeaf

    val passwordEncoder = mockk<PasswordEncoder>()
    val userRepository = mockk<UserRepository>()
    val authenticationManager = mockk<AuthenticationManager>()
    val jwtProvider = mockk<JwtProvider>()
    val authService = AuthService(passwordEncoder, userRepository, authenticationManager, jwtProvider)

    Given("정상적인 회원가입 요청이 주어지고") {
        val request = UserSignUpRequest(
            username = "newuser",
            password = "password123",
            name = "New User",
            email = "new@example.com",
            phone = "010-0000-0000"
        )

        every { userRepository.existsByUsername("newuser") } returns false
        every { passwordEncoder.encode("password123") } returns "encoded-password"
        every { userRepository.save(any()) } answers {
            val user = firstArg<User>()
            User(
                id = 1L,
                username = user.username,
                password = user.password,
                name = user.name,
                email = user.email,
                phone = user.phone
            )
        }

        When("회원가입을 하면") {
            val userId = authService.signUp(request)

            Then("사용자 ID가 반환된다") {
                userId shouldBe 1L
                verify(exactly = 1) { userRepository.existsByUsername("newuser") }
                verify(exactly = 1) { passwordEncoder.encode("password123") }
                verify(exactly = 1) { userRepository.save(any()) }
            }
        }
    }

    Given("중복된 username으로 회원가입 요청이 주어지고") {
        val request = UserSignUpRequest(
            username = "duplicate",
            password = "password",
            name = "User1",
            phone = "010-1111-1111"
        )

        every { userRepository.existsByUsername("duplicate") } returns true

        When("회원가입을 하면") {
            val exception = shouldThrow<CustomException> {
                authService.signUp(request)
            }

            Then("DUPLICATE_USERNAME 예외가 발생한다") {
                exception.errorCode shouldBe ErrorCode.DUPLICATE_USERNAME
                verify(exactly = 0) { userRepository.save(any()) }
            }
        }
    }

    Given("정상적인 로그인 요청이 주어지고") {
        val request = UserSignInRequest(username = "loginuser", password = "password123")
        val user = User(
            id = 1L,
            username = "loginuser",
            password = "encoded",
            name = "Login User",
            phone = "010-2222-2222"
        )

        every { authenticationManager.authenticate(any()) } returns mockk()
        every { userRepository.findByUsername("loginuser") } returns user
        every { jwtProvider.generateAccessToken(1L, "loginuser", Role.STAFF, any()) } returns "jwt-token-value"

        When("로그인을 하면") {
            val token = authService.signIn(request)

            Then("JWT 토큰이 발급된다") {
                token shouldBe "jwt-token-value"
                verify(exactly = 1) { authenticationManager.authenticate(any()) }
                verify(exactly = 1) { userRepository.findByUsername("loginuser") }
                verify(exactly = 1) { jwtProvider.generateAccessToken(1L, "loginuser", Role.STAFF, any()) }
            }
        }
    }

    Given("잘못된 비밀번호로 로그인 요청이 주어지고") {
        val request = UserSignInRequest(username = "failuser", password = "wrongPassword")

        every { authenticationManager.authenticate(any()) } throws BadCredentialsException("Bad credentials")

        When("로그인을 하면") {
            val exception = shouldThrow<CustomException> {
                authService.signIn(request)
            }

            Then("INVALID_CREDENTIALS 예외가 발생한다") {
                exception.errorCode shouldBe ErrorCode.INVALID_CREDENTIALS
            }
        }
    }

    Given("존재하지 않는 사용자로 로그인 요청이 주어지고") {
        val request = UserSignInRequest(username = "nonexistent", password = "password123")

        every { authenticationManager.authenticate(any()) } returns mockk()
        every { userRepository.findByUsername("nonexistent") } returns null

        When("로그인을 하면") {
            val exception = shouldThrow<CustomException> {
                authService.signIn(request)
            }

            Then("NOT_FOUND_USER 예외가 발생한다") {
                exception.errorCode shouldBe ErrorCode.NOT_FOUND_USER
            }
        }
    }

    Given("비밀번호 암호화 확인을 위한 회원가입 요청이 주어지고") {
        val plainPassword = "mySecretPassword"
        val request = UserSignUpRequest(
            username = "encodedUser",
            password = plainPassword,
            name = "Encoded User",
            phone = "010-5555-5555"
        )

        every { userRepository.existsByUsername("encodedUser") } returns false
        every { passwordEncoder.encode(plainPassword) } returns "bcrypt-encoded-value"

        val userSlot = slot<User>()
        every { userRepository.save(capture(userSlot)) } answers {
            val user = firstArg<User>()
            User(
                id = 1L,
                username = user.username,
                password = user.password,
                name = user.name,
                phone = user.phone
            )
        }

        When("회원가입을 하면") {
            authService.signUp(request)

            Then("비밀번호가 암호화되어 저장된다") {
                verify(exactly = 1) { passwordEncoder.encode(plainPassword) }
                userSlot.captured.password shouldBe "bcrypt-encoded-value"
            }
        }
    }
})
