package org.core.scheduleflow.domain.project.controller

import org.core.scheduleflow.domain.project.dto.ProjectCreateRequest
import org.core.scheduleflow.domain.project.dto.ProjectDetailResponse
import org.core.scheduleflow.domain.project.dto.ProjectSummaryResponse
import org.core.scheduleflow.domain.project.dto.ProjectUpdateRequest
import org.core.scheduleflow.domain.project.service.ProjectService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/projects")
class ProjectController(
    private val service: ProjectService
) {
    @GetMapping
    fun getProjects(): ResponseEntity<List<ProjectSummaryResponse>> {
        return ResponseEntity.ok(service.findProjects())
    }

    @GetMapping("/{projectId}")
    fun getProject(@PathVariable projectId: Long): ResponseEntity<ProjectDetailResponse> {
        return ResponseEntity.ok(service.findProject(projectId))
    }

    @PostMapping
    fun createProject(
        @RequestBody request: ProjectCreateRequest
    ): ResponseEntity<Long> = ResponseEntity.status(HttpStatus.CREATED).body(
        service.createProject(request)
    )

    @PatchMapping("/{projectId}")
    fun updateProject(
        @PathVariable projectId: Long,
        @RequestBody request: ProjectUpdateRequest): ResponseEntity<ProjectDetailResponse> {
        return ResponseEntity.ok(service.updateProject(projectId, request))
    }

    @DeleteMapping("/{projectId}")
    fun deleteProject(@PathVariable projectId: Long): ResponseEntity<Void> {
        service.deleteProject(projectId)
        return ResponseEntity.noContent().build()
    }


}