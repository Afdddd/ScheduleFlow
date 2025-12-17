package org.core.scheduleflow.domain.user.controller

import org.core.scheduleflow.domain.user.constant.Role
import org.core.scheduleflow.domain.user.dto.UserSignInRequest
import org.core.scheduleflow.domain.user.dto.UserSignUpRequest
import org.core.scheduleflow.domain.user.repository.UserRepository
import org.core.scheduleflow.domain.user.service.AuthService
import org.core.scheduleflow.global.security.jwt.JwtProvider
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.data.repository.findByIdOrNull
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.delete
import org.springframework.transaction.annotation.Transactional
import kotlin.test.Test

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("test")
class UserControllerTest @Autowired constructor(
    val mockMvc: MockMvc,
    val userRepository: UserRepository,
    val authService: AuthService,
    val jwtProvider: JwtProvider,
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
    @DisplayName("403 - ADMIN 토큰으로 삭제 API 호출 시 성공")
    fun deleteUser_withAdminToken_success() {
        // given
        val user = userRepository.findByIdOrNull(adminUserId!!)
        user!!.updateRole(Role.ADMIN)
        userRepository.save(user)
        val token = authService.signIn(UserSignInRequest("admin", "password"))
        jwtProvider.getAuthentication(token).authorities.forEach { println(it.authority) }

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






}