package org.core.scheduleflow.domain.user.service

import org.core.scheduleflow.domain.user.dto.UserResponse
import org.core.scheduleflow.domain.user.dto.UserUpdateRequest
import org.core.scheduleflow.domain.user.repository.UserRepository
import org.core.scheduleflow.global.exception.CustomException
import org.core.scheduleflow.global.exception.ErrorCode
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class UserService(
    private val userRepository: UserRepository
) {

    @Transactional(readOnly = true)
    fun findUsers(): List<UserResponse> {
       val userList = userRepository.findAll()

        return userList.map { user ->
            val userId = requireNotNull(user.id) {
                "User 엔티티의 id가 null입니다."
            }

            UserResponse(
                id = userId,
                name = user.name,
                email = user.email,
                phone = user.phone,
                position = user.position
            )
        }
    }

    @Transactional(readOnly = true)
    fun findUserById(userId: Long): UserResponse {
        val user = userRepository.findByIdOrNull(userId)
            ?: throw CustomException(ErrorCode.NOT_FOUND_USER)

        val id = requireNotNull(user.id) {
            "User 엔티티의 id가 null입니다."
        }

        return UserResponse(
            id = id,
            name = user.name,
            email = user.email,
            phone = user.phone,
            position = user.position
        )
    }

    @Transactional
    fun updateUser(userId: Long, request: UserUpdateRequest): UserResponse {
        val user = userRepository.findByIdOrNull(userId)
            ?: throw CustomException(ErrorCode.NOT_FOUND_USER)

        request.name?.let { user.name = it }
        request.phone?.let { user.phone = it }
        request.email?.let { user.email = it }
        request.position?.let { user.position = it }

        val updatedUser = userRepository.save(user)
        val id = requireNotNull(updatedUser.id) {
            "User 엔티티의 id가 null입니다."
        }

        return UserResponse(
            id = id,
            name = updatedUser.name,
            email = updatedUser.email,
            phone = updatedUser.phone,
            position = updatedUser.position
        )
    }

    @Transactional
    fun deleteUser(userId: Long) {
        val user = userRepository.findByIdOrNull(userId)
            ?: throw CustomException(ErrorCode.NOT_FOUND_USER)

        userRepository.delete(user)
    }

}