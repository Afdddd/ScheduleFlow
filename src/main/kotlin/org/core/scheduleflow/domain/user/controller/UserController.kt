package org.core.scheduleflow.domain.user.controller

import org.core.scheduleflow.domain.user.dto.UserResponse
import org.core.scheduleflow.domain.user.dto.UserUpdateRequest
import org.core.scheduleflow.domain.user.service.UserService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/users")
class UserController(
    private val service: UserService
) {

    @GetMapping
    fun getUsers(): ResponseEntity<List<UserResponse>> {
        return ResponseEntity.ok(service.findUsers())
    }

    @GetMapping("/{userId}")
    fun getUser(@PathVariable userId: Long):ResponseEntity<UserResponse> {
        return ResponseEntity.ok(service.findUserById(userId))
    }

    @PatchMapping("/{userId}")
    fun updateUser(
        @PathVariable userId: Long,
        @RequestBody request: UserUpdateRequest
    ): ResponseEntity<UserResponse> {
        return ResponseEntity.ok(service.updateUser(userId, request))
    }

    @DeleteMapping("/{userId}")
    fun deleteUser(@PathVariable userId: Long): ResponseEntity<Void> {
        service.deleteUser(userId)
        return ResponseEntity.noContent().build()
    }
}