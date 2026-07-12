package org.core.scheduleflow.domain.user.controller

import org.core.scheduleflow.domain.user.dto.UserSignInRequest
import org.core.scheduleflow.domain.user.dto.UserSignUpRequest
import org.core.scheduleflow.domain.user.service.AuthService
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.http.MediaType
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import org.springframework.transaction.annotation.Transactional

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("test")
class AuthControllerTest @Autowired constructor(
    val mockMvc: MockMvc,
    val authService: AuthService,
) {

    var userId: Long? = null

    @BeforeEach
    fun setUp() {
        userId = authService.signUp(
            UserSignUpRequest(
                username = "member",
                password = "password",
                name = "member",
                phone = "010-1111-1111"
            )
        )
    }

    @Test
    @DisplayName("로그인 시 액세스·리프레시 토큰 쌍이 발급된다")
    fun signIn_returnsTokenPair() {
        mockMvc.post("/auth/sign-in") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"username":"member","password":"password"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.accessToken") { isNotEmpty() }
            jsonPath("$.refreshToken") { isNotEmpty() }
        }
    }

    @Test
    @DisplayName("리프레시 토큰으로 새 토큰 쌍을 발급받고, 새 액세스 토큰으로 API 호출이 된다")
    fun refresh_rotatesTokensAndNewAccessTokenWorks() {
        // given: 로그인으로 받은 리프레시 토큰
        val tokens = authService.signIn(UserSignInRequest("member", "password"))

        // when: 만료된 액세스 토큰 상황을 가정하고 refresh 호출(인증 헤더 없이 — permitAll이어야 한다)
        val result = mockMvc.post("/auth/refresh") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"refreshToken":"${tokens.refreshToken}"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.accessToken") { isNotEmpty() }
            jsonPath("$.refreshToken") { isNotEmpty() }
        }.andReturn()

        // then: 새 액세스 토큰이 실제 보호 API에서 통한다
        val newAccessToken = Regex(""""accessToken"\s*:\s*"([^"]+)"""")
            .find(result.response.contentAsString)!!.groupValues[1]
        mockMvc.get("/users/$userId") {
            header("Authorization", "Bearer $newAccessToken")
        }.andExpect {
            status { isOk() }
        }
    }

    @Test
    @DisplayName("401 - 액세스 토큰으로는 refresh가 거부된다")
    fun refresh_withAccessToken_unauthorized() {
        val tokens = authService.signIn(UserSignInRequest("member", "password"))

        mockMvc.post("/auth/refresh") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"refreshToken":"${tokens.accessToken}"}"""
        }.andExpect {
            status { isUnauthorized() }
        }
    }

    @Test
    @DisplayName("401 - 위조된 리프레시 토큰은 거부된다")
    fun refresh_withInvalidToken_unauthorized() {
        mockMvc.post("/auth/refresh") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"refreshToken":"this.is.invalid"}"""
        }.andExpect {
            status { isUnauthorized() }
        }
    }

    @Test
    @DisplayName("401 - 리프레시 토큰을 액세스 토큰 자리(Authorization)에 쓰면 인증되지 않는다")
    fun refreshToken_asBearerToken_unauthorized() {
        val tokens = authService.signIn(UserSignInRequest("member", "password"))

        mockMvc.get("/users/$userId") {
            header("Authorization", "Bearer ${tokens.refreshToken}")
        }.andExpect {
            status { isUnauthorized() }
        }
    }
}
