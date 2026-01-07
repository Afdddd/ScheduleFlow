package org.core.scheduleflow.domain.project.controller

import org.core.scheduleflow.domain.project.dto.ProjectCalendarResponse
import org.core.scheduleflow.domain.project.dto.ProjectCalendarWithSchedulesResponse
import org.core.scheduleflow.domain.project.dto.ProjectCreateRequest
import org.core.scheduleflow.domain.project.dto.ProjectDetailResponse
import org.core.scheduleflow.domain.project.dto.ProjectListResponse
import org.core.scheduleflow.domain.project.dto.ProjectUpdateRequest
import org.core.scheduleflow.domain.project.service.ProjectService
import org.core.scheduleflow.global.dto.PageResponse
import org.springframework.data.domain.PageRequest
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDate

@RestController
@RequestMapping("/projects")
class ProjectController(
    private val service: ProjectService
) {
    @GetMapping
    fun getProjects(
        @RequestParam keyword: String?,
        @RequestParam page: Int,
        @RequestParam size: Int
    ): ResponseEntity<PageResponse<ProjectListResponse>> {
        val pageable = PageRequest.of(page, size)
        var result = service.findProjects(keyword, pageable)
        return ResponseEntity.ok(PageResponse.from(result))
    }

    @GetMapping("/{projectId}")
    fun getProject(@PathVariable projectId: Long): ResponseEntity<ProjectDetailResponse> {
        return ResponseEntity.ok(service.findProject(projectId))
    }

    @GetMapping("/period")
    fun getProjectsByPeriodWith(
        @RequestParam
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        startDate: LocalDate,

        @RequestParam
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        endDate: LocalDate,
    ): ResponseEntity<List<ProjectCalendarResponse>> {
        return ResponseEntity.ok(service.findProjectsByPeriod(startDate, endDate))
    }

    @GetMapping("/period/with-schedules")
    fun getProjectsByPeriodWithSchedules(
        @RequestParam
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        startDate: LocalDate,

        @RequestParam
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        endDate: LocalDate,
    ): ResponseEntity<List<ProjectCalendarWithSchedulesResponse>> {
            return ResponseEntity.ok(service.findProjectsByPeriodWithSchedules(startDate, endDate))
        }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    fun createProject(
        @RequestBody request: ProjectCreateRequest
    ): ResponseEntity<Long> = ResponseEntity.status(HttpStatus.CREATED).body(
        service.createProject(request)
    )

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{projectId}")
    fun updateProject(
        @PathVariable projectId: Long,
        @RequestBody request: ProjectUpdateRequest): ResponseEntity<ProjectDetailResponse> {
        return ResponseEntity.ok(service.updateProject(projectId, request))
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{projectId}")
    fun deleteProject(@PathVariable projectId: Long): ResponseEntity<Void> {
        service.deleteProject(projectId)
        return ResponseEntity.noContent().build()
    }


}