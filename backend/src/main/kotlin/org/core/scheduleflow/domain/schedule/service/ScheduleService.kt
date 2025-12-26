package org.core.scheduleflow.domain.schedule.service

import org.core.scheduleflow.domain.project.repository.ProjectRepository
import org.core.scheduleflow.domain.schedule.constant.ScheduleType
import org.core.scheduleflow.domain.schedule.dto.ScheduleCreateRequest
import org.core.scheduleflow.domain.schedule.dto.ScheduleDetailResponse
import org.core.scheduleflow.domain.schedule.dto.ScheduleMemberDto
import org.core.scheduleflow.domain.schedule.dto.ScheduleSummaryResponse
import org.core.scheduleflow.domain.schedule.dto.ScheduleUpdateRequest
import org.core.scheduleflow.domain.schedule.entity.Schedule
import org.core.scheduleflow.domain.schedule.entity.ScheduleMember
import org.core.scheduleflow.domain.schedule.repository.ScheduleRepository
import org.core.scheduleflow.domain.user.repository.UserRepository
import org.core.scheduleflow.global.exception.CustomException
import org.core.scheduleflow.global.exception.ErrorCode
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class ScheduleService(

    private val scheduleRepository: ScheduleRepository,
    private val projectRepository: ProjectRepository,
    private val userRepository: UserRepository,
) {

    fun createSchedule(request: ScheduleCreateRequest): Long {
        val schedule = Schedule(
            type = request.scheduleType ?: ScheduleType.PROJECT,
            title = request.title,
            startDate = request.startDate,
            endDate = request.endDate
        )

        val savedSchedule = scheduleRepository.save(schedule)

        if (request.projectId != null) {
            val project = projectRepository.findByIdOrNull(request.projectId)
                ?: throw CustomException(ErrorCode.NOT_FOUND_PROJECT)
            savedSchedule.updateProject(project)
        }

        request.memberIds
            ?.takeIf { it.isNotEmpty() }
            ?.let { memberIds ->
                val members = userRepository.findAllById(memberIds)
                    .map { user ->
                        ScheduleMember(
                            schedule = savedSchedule,
                            user = user
                        )
                    }
                savedSchedule.updateScheduleMembers(members)
            }
        return savedSchedule.id!!
    }

    @Transactional(readOnly = true)
    fun findSchedule(id: Long): ScheduleDetailResponse {
        val schedule = scheduleRepository.findByIdWithProject(id)
            ?: throw CustomException(ErrorCode.NOT_FOUND_SCHEDULE)
        val members = schedule.members.map { ScheduleMemberDto.from(it) }
        return ScheduleDetailResponse.from(schedule, members)
    }

    @Transactional(readOnly = true)
    fun findSchedules(): List<ScheduleSummaryResponse> {
        val schedules = scheduleRepository.findAllWithProject()
        if (schedules.isEmpty()) {
            return emptyList()
        }
        return schedules.map { ScheduleSummaryResponse.from(it) }
    }

    fun updateSchedule(id: Long, request: ScheduleUpdateRequest): ScheduleDetailResponse {
        val schedule = scheduleRepository.findByIdOrNull(id)
            ?: throw CustomException(ErrorCode.NOT_FOUND_SCHEDULE)

        // 필드 업데이트
        request.title?.let { schedule.title = it }
        request.startDate?.let { schedule.startDate = it }
        request.endDate?.let { schedule.endDate = it }
        request.scheduleType?.let { schedule.updateScheduleType(it) }

        // 프로젝트 업데이트
        request.projectId?.let {
            val project = projectRepository.findByIdOrNull(it) ?: throw CustomException(ErrorCode.NOT_FOUND_PROJECT)
            schedule.updateProject(project)
        }

        // 멤버 업데이트
        request.memberIds?.let { ids ->
            val users = userRepository.findAllById(ids)
            if (users.size != ids.size) throw CustomException(ErrorCode.NOT_FOUND_USER)

            val newMembers = users.map { ScheduleMember(schedule = schedule, user = it) }
            schedule.updateScheduleMembers(newMembers)
        }

        return ScheduleDetailResponse.from(schedule, schedule.members.map { ScheduleMemberDto.from(it) })
    }

    fun deleteSchedule(id: Long) {
        scheduleRepository.deleteById(id)
    }
}