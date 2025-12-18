package org.core.scheduleflow.domain.user.service

import org.core.scheduleflow.domain.user.dto.UserUpdateRequest
import org.core.scheduleflow.domain.user.entity.User
import org.core.scheduleflow.domain.user.repository.UserRepository
import org.core.scheduleflow.global.exception.CustomException
import org.core.scheduleflow.global.exception.ErrorCode
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.transaction.annotation.Transactional

@SpringBootTest
@Transactional
@ActiveProfiles("test")
class UserServiceIntegrationTest @Autowired constructor(
    private var userService: UserService,
    private var userRepository: UserRepository
) {

    lateinit var testUser : User

    @BeforeEach
    fun setUp() {
        testUser = User(
            username = "test-user-name",
            password = "test-password",
            name = "test-user",
            email = "test@example.com",
            phone = "010-0000-0000",
            position = "developer"
        )
    }

    @Test
    fun findUsers_success() {
        val user = userRepository.save(testUser)

        val result = userService.findUsers()

        assertTrue(result.size == 1)
        assertTrue(result.any { it.id == user.id && it.name == "test-user" })
    }

    @Test
    fun findUserById_success() {
        val user = userRepository.save(testUser)

        val result = userService.findUserById(user.id!!)

        assertEquals("test-user", result.name)
        assertEquals("developer", result.position)
    }

    @Test
    fun findUserById_notFound() {
        val exception = assertThrows<CustomException> {
            userService.findUserById(999L)
        }
        assertEquals(ErrorCode.NOT_FOUND_USER, exception.errorCode)
    }

    @Test
    fun updateUser_success() {
        val user = userRepository.save(testUser)
        val request = UserUpdateRequest(name = "update-user", email = null, phone = null, position = "PM")

        val updated = userService.updateUser(user.id!!, request)

        assertEquals("update-user", updated.name)
        assertEquals("PM", updated.position)
    }

    @Test
    fun deleteUser_success() {
        val user = userRepository.save(testUser)
        userService.deleteUser(user.id!!)
        assertFalse(userRepository.findById(user.id!!).isPresent)
    }

    @Test
    fun deleteUser_notFound() {
        val exception = assertThrows<CustomException> {
            userService.deleteUser(999L)
        }
        assertEquals(ErrorCode.NOT_FOUND_USER, exception.errorCode)
    }
}