package org.core.scheduleflow.domain.user.service

import org.core.scheduleflow.domain.user.dto.TodayTeamTaskGroup
import org.core.scheduleflow.domain.user.dto.UserListResponse
import org.core.scheduleflow.domain.user.dto.UserResponse
import org.core.scheduleflow.domain.user.dto.UserUpdateRequest
import org.core.scheduleflow.domain.user.entity.User
import org.core.scheduleflow.domain.user.repository.UserRepository
import org.core.scheduleflow.global.exception.CustomException
import org.core.scheduleflow.global.exception.ErrorCode
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate

@Service
class UserService(
    private val userRepository: UserRepository
) {

    @Transactional(readOnly = true)
    fun findUsers(
        keyword: String?,
        pageable: Pageable
    ): Page<UserListResponse> {
        if(keyword.isNullOrBlank()) {
            return userRepository.findUserList(pageable)
        }
        return userRepository.searchUserList(keyword, pageable)
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

    @Transactional(readOnly = true)
    fun findTodayTeamTasks(date: LocalDate): List<TodayTeamTaskGroup> {
        val tasks = userRepository.findTeamTasksByDate(date)

        return tasks
            .groupBy { it.userId }
            .map { (userId, teamTasks) ->
                TodayTeamTaskGroup(
                    userId = userId,
                    memberName = teamTasks.first().memberName,
                    tasks = teamTasks.filter { it.scheduleTitle != null }
                )
            }
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
        return updatedUser.toResponse()
    }

    @Transactional
    fun deleteUser(userId: Long) {
        val user = userRepository.findByIdOrNull(userId)
            ?: throw CustomException(ErrorCode.NOT_FOUND_USER)

        userRepository.delete(user)
    }

    private fun User.toResponse(): UserResponse {
        return UserResponse(
            id = requireNotNull(id) { "User 엔티티의 id가 null입니다." },
            name = name,
            email = email,
            phone = phone,
            position = position
        )
    }
}