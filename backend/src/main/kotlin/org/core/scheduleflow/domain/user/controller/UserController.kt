package org.core.scheduleflow.domain.user.controller

import org.core.scheduleflow.domain.user.dto.TodayTeamTaskResponse
import org.core.scheduleflow.domain.user.dto.UserResponse
import org.core.scheduleflow.domain.user.dto.UserUpdateRequest
import org.core.scheduleflow.domain.user.service.UserService
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDate

@RestController
@RequestMapping("/users")
class UserController(
    private val service: UserService
) {

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    fun getUsers(): ResponseEntity<List<UserResponse>> {
        return ResponseEntity.ok(service.findUsers())
    }

    @PreAuthorize("hasRole('ADMIN') or #userId == authentication.principal.['userId']")
    @GetMapping("/{userId}")
    fun getUser(@PathVariable userId: Long):ResponseEntity<UserResponse> {
        return ResponseEntity.ok(service.findUserById(userId))
    }

    @PreAuthorize("hasRole('ADMIN') or #userId == authentication.principal.['userId']")
    @PatchMapping("/{userId}")
    fun updateUser(
        @PathVariable userId: Long,
        @RequestBody request: UserUpdateRequest
    ): ResponseEntity<UserResponse> {
        return ResponseEntity.ok(service.updateUser(userId, request))
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{userId}")
    fun deleteUser(@PathVariable userId: Long): ResponseEntity<Void> {
        service.deleteUser(userId)
        return ResponseEntity.noContent().build()
    }

    @GetMapping("/team-tasks")
    fun getTodayTeamTasks(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) date: LocalDate):
            ResponseEntity<List<TodayTeamTaskResponse>> {
        return ResponseEntity.ok(service.findTodayTeamTasks(date))
    }
}