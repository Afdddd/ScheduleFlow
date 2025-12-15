package org.core.scheduleflow.domain.user.repository

import org.core.scheduleflow.domain.user.entity.User
import org.springframework.data.jpa.repository.JpaRepository

interface UserRepository: JpaRepository<User,Long> {
    fun existsByUsername(username: String): Boolean
    fun findByUsername(username: String): User?
}