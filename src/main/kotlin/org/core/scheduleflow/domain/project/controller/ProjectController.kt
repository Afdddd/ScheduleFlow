package org.core.scheduleflow.domain.project.controller

import org.core.scheduleflow.domain.project.dto.ProjectCreateRequest
import org.core.scheduleflow.domain.project.service.ProjectService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/projects")
class ProjectController(
    private val service: ProjectService
) {
    @PostMapping
    fun createProject(
        @RequestBody request: ProjectCreateRequest
    ): ResponseEntity<Long> = ResponseEntity.status(HttpStatus.CREATED).body(
        service.createProject(request)
    )
}