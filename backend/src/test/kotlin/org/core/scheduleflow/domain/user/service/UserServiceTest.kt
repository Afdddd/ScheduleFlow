package org.core.scheduleflow.domain.user.service

import io.kotest.assertions.throwables.shouldThrow
import io.kotest.core.spec.IsolationMode
import io.kotest.core.spec.style.BehaviorSpec
import io.kotest.matchers.shouldBe
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.core.scheduleflow.domain.user.constant.Role
import org.core.scheduleflow.domain.user.dto.UserListResponse
import org.core.scheduleflow.domain.user.dto.UserUpdateRequest
import org.core.scheduleflow.domain.user.entity.User
import org.core.scheduleflow.domain.user.repository.UserRepository
import org.core.scheduleflow.global.exception.CustomException
import org.core.scheduleflow.global.exception.ErrorCode
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import org.springframework.data.repository.findByIdOrNull

class UserServiceTest : BehaviorSpec({

    isolationMode = IsolationMode.InstancePerLeaf

    val userRepository = mockk<UserRepository>()
    val userService = UserService(userRepository)

    fun createUser(
        id: Long = 1L,
        username: String = "test-user-name",
        name: String = "test-user",
        email: String? = "test@example.com",
        phone: String = "010-0000-0000",
        position: String? = "developer"
    ): User {
        return User(
            id = id,
            username = username,
            password = "test-password",
            name = name,
            email = email,
            phone = phone,
            position = position
        )
    }

    Given("사용자 목록 조회 요청이 주어지고") {
        val pageable = PageRequest.of(0, 10)
        val userListResponse = UserListResponse(
            id = 1L,
            name = "test-user",
            username = "test-user-name",
            email = "test@example.com",
            phone = "010-0000-0000",
            position = "developer",
            role = Role.STAFF
        )
        val expectedPage = PageImpl(listOf(userListResponse), pageable, 1)

        When("키워드가 빈 문자열이면") {
            every { userRepository.findUserList(pageable) } returns expectedPage

            val result = userService.findUsers("", pageable)

            Then("전체 목록을 조회하는 findUserList가 호출된다") {
                result.content.size shouldBe 1
                result.content[0].id shouldBe 1L
                result.content[0].name shouldBe "test-user"
                result.totalElements shouldBe 1L
                verify(exactly = 1) { userRepository.findUserList(pageable) }
                verify(exactly = 0) { userRepository.searchUserList(any(), any()) }
            }
        }

        When("유효한 키워드가 주어지면") {
            val keyword = "test"
            every { userRepository.searchUserList(keyword, pageable) } returns expectedPage

            val result = userService.findUsers(keyword, pageable)

            Then("검색 메서드인 searchUserList가 호출된다") {
                result.content.size shouldBe 1
                verify(exactly = 1) { userRepository.searchUserList(eq(keyword), any()) }
                verify(exactly = 0) { userRepository.findUserList(any()) }
            }
        }
    }

    Given("존재하는 사용자 ID로 조회 요청이 주어지고") {
        val user = createUser()
        every { userRepository.findByIdOrNull(1L) } returns user

        When("조회하면") {
            val result = userService.findUserById(1L)

            Then("사용자 정보가 반환된다") {
                result.name shouldBe "test-user"
                result.position shouldBe "developer"
                verify(exactly = 1) { userRepository.findByIdOrNull(1L) }
            }
        }
    }

    Given("존재하지 않는 사용자 ID로 조회 요청이 주어지고") {
        every { userRepository.findByIdOrNull(999L) } returns null

        When("조회하면") {
            val exception = shouldThrow<CustomException> {
                userService.findUserById(999L)
            }

            Then("NOT_FOUND_USER 예외가 발생한다") {
                exception.errorCode shouldBe ErrorCode.NOT_FOUND_USER
            }
        }
    }

    Given("사용자 수정 요청이 주어지고") {
        val user = createUser()
        val request = UserUpdateRequest(name = "update-user", email = null, phone = null, position = "PM")

        every { userRepository.findByIdOrNull(1L) } returns user
        every { userRepository.save(any()) } answers { firstArg() }

        When("수정하면") {
            val result = userService.updateUser(1L, request)

            Then("수정된 사용자 정보가 반환된다") {
                result.name shouldBe "update-user"
                result.position shouldBe "PM"
                verify(exactly = 1) { userRepository.findByIdOrNull(1L) }
                verify(exactly = 1) { userRepository.save(any()) }
            }
        }
    }

    Given("존재하는 사용자 삭제 요청이 주어지고") {
        val user = createUser()
        every { userRepository.findByIdOrNull(1L) } returns user
        every { userRepository.delete(user) } returns Unit

        When("삭제하면") {
            userService.deleteUser(1L)

            Then("삭제가 정상 처리된다") {
                verify(exactly = 1) { userRepository.findByIdOrNull(1L) }
                verify(exactly = 1) { userRepository.delete(user) }
            }
        }
    }

    Given("존재하지 않는 사용자 삭제 요청이 주어지고") {
        every { userRepository.findByIdOrNull(999L) } returns null

        When("삭제하면") {
            val exception = shouldThrow<CustomException> {
                userService.deleteUser(999L)
            }

            Then("NOT_FOUND_USER 예외가 발생한다") {
                exception.errorCode shouldBe ErrorCode.NOT_FOUND_USER
            }
        }
    }
})
