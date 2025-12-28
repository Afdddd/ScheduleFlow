package org.core.scheduleflow.domain.schedule.controller

import org.core.scheduleflow.domain.schedule.dto.MyTaskResponse
import org.core.scheduleflow.domain.schedule.dto.ScheduleCalenderResponse
import org.core.scheduleflow.domain.schedule.dto.ScheduleCreateRequest
import org.core.scheduleflow.domain.schedule.dto.ScheduleDetailResponse
import org.core.scheduleflow.domain.schedule.dto.ScheduleSummaryResponse
import org.core.scheduleflow.domain.schedule.dto.ScheduleUpdateRequest
import org.core.scheduleflow.domain.schedule.dto.TodayTeamTaskResponse
import org.core.scheduleflow.domain.schedule.service.ScheduleService
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
@RequestMapping("/schedules")
class ScheduleController(
    private val service: ScheduleService
) {
    @GetMapping
    fun getSchedules(): ResponseEntity<List<ScheduleSummaryResponse>> {
        return ResponseEntity.ok(service.findSchedules())
    }

    @GetMapping("/{scheduleId}")
    fun getSchedule(@PathVariable scheduleId: Long): ResponseEntity<ScheduleDetailResponse> {
        return ResponseEntity.ok(service.findSchedule(scheduleId))
    }

    @GetMapping("/period")
    fun getSchedulesByPeriod(
        @RequestParam
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        startDate: LocalDate,

        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        @RequestParam endDate: LocalDate
    ): ResponseEntity<List<ScheduleCalenderResponse>> {
        return ResponseEntity.ok(service.findSchedulesByPeriod(startDate, endDate))
    }

    @GetMapping("/my-tasks")
    fun getMyTasks(
        @RequestParam
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        startDate: LocalDate,

        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        @RequestParam endDate: LocalDate,

        @RequestParam userId: Long
    ): ResponseEntity<List<MyTaskResponse>> {
        return ResponseEntity.ok(service.findMyTask(userId, startDate, endDate))
    }

    @GetMapping("/team-tasks")
    fun getTodayTeamTasks(@RequestParam @DateTimeFormat date: LocalDate)
    : ResponseEntity<List<TodayTeamTaskResponse>> {
        return ResponseEntity.ok(service.findTodayTeamTasks(date))
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    fun createSchedule(
        @RequestBody request: ScheduleCreateRequest
    ): ResponseEntity<Long> = ResponseEntity.status(HttpStatus.CREATED).body(
        service.createSchedule(request)
    )

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{scheduleId}")
    fun updateSchedule(
        @PathVariable scheduleId: Long,
        @RequestBody request: ScheduleUpdateRequest
    ): ResponseEntity<ScheduleDetailResponse> {
        return ResponseEntity.ok(service.updateSchedule(scheduleId, request))
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{scheduleId}")
    fun deleteSchedule(@PathVariable scheduleId: Long): ResponseEntity<Void> {
        service.deleteSchedule(scheduleId)
        return ResponseEntity.noContent().build()
    }
}