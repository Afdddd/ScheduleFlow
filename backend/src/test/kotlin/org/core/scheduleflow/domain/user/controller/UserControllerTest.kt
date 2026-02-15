package org.core.scheduleflow.domain.user.controller

import org.core.scheduleflow.domain.user.constant.Role
import org.core.scheduleflow.domain.user.dto.UserSignInRequest
import org.core.scheduleflow.domain.user.dto.UserSignUpRequest
import org.core.scheduleflow.domain.user.repository.UserRepository
import org.core.scheduleflow.domain.user.service.AuthService
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.data.repository.findByIdOrNull
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.delete
import org.springframework.test.web.servlet.get
import org.springframework.transaction.annotation.Transactional

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("test")
class UserControllerTest @Autowired constructor(
    val mockMvc: MockMvc,
    val userRepository: UserRepository,
    val authService: AuthService,
) {

    var adminUserId: Long? = null
    var staffUserId: Long? = null
    var targetUserId: Long? = null

    @BeforeEach
    fun setUp() {
        adminUserId = authService.signUp(
            UserSignUpRequest(
                username = "admin",
                password = "password",
                name = "admin",
                phone = "010-1111-1111")
        )

        userRepository.findByIdOrNull(adminUserId!!)?.updateRole(Role.ADMIN)

        staffUserId = authService.signUp(
            UserSignUpRequest(
                username = "staff",
                password = "password",
                name = "staff",
                phone = "010-2222-2222")
        )

        targetUserId = authService.signUp(
            UserSignUpRequest(
                username = "target",
                password = "password",
                name = "target",
                phone = "010-3333-3333")
        )
    }

    @Test
    @DisplayName("ADMIN 토큰으로 삭제 API 호출 시 성공")
    fun deleteUser_withAdminToken_success() {
        // given
        val token = authService.signIn(UserSignInRequest("admin", "password"))

        // when & then
        mockMvc.delete("/users/$targetUserId") {
            header("Authorization", "Bearer $token")
        }.andExpect {
            status { isNoContent() }
        }
    }

    @Test
    @DisplayName("403 - STAFF 토큰으로 ADMIN 전용 API 호출 시 403")
    fun deleteUser_withStaffToken_fail() {
        // given
        val token = authService.signIn(UserSignInRequest("staff", "password"))

        // when & then
        mockMvc.delete("/users/$targetUserId") {
            header("Authorization", "Bearer $token")
        }.andExpect {
            status { isForbidden() }
        }
    }

    @Test
    @DisplayName("401 - 토큰 없이 ADMIN 전용 API 호출 시 401")
    fun deleteUser_withoutToken_unauthorized() {
        mockMvc.delete("/users/$targetUserId") {
        }.andExpect {
            status { isUnauthorized() }
        }
    }


    @Test
    @DisplayName("403 - 다른 사용자 계정 조회 시 403 반환")
    fun getUser_whenAccessingOtherUserAccount_thenForbidden() {
        val token = authService.signIn(UserSignInRequest("staff", "password"))

        mockMvc.get("/users/$targetUserId") {
            header("Authorization", "Bearer $token")
        }.andExpect {
            status { isForbidden() }
        }
    }

    @Test
    @DisplayName("200 - 본인 계정 정보 조회 성공")
    fun getUser_whenAccessingOwnAccount_thenSuccess() {
        val token = authService.signIn(UserSignInRequest("target", "password"))

        mockMvc.get("/users/$targetUserId") {
            header("Authorization", "Bearer $token")
        }.andExpect {
            status { isOk() }
        }
    }

    @Test
    @DisplayName("200 - ADMIN이 다른 사용자 정보 조회 성공")
    fun getUser_whenAdminAccessesOtherUserAccount_thenSuccess() {
        val token = authService.signIn(UserSignInRequest("admin", "password"))
        mockMvc.get("/users/$targetUserId") {
            header("Authorization", "Bearer $token")
        }.andExpect {
            status { isOk() }
        }
    }
}