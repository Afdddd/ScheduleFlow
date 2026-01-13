package org.core.scheduleflow.domain.schedule.service

import org.core.scheduleflow.domain.project.repository.ProjectRepository
import org.core.scheduleflow.domain.schedule.constant.ScheduleType
import org.core.scheduleflow.domain.schedule.dto.ProjectTaskGroup
import org.core.scheduleflow.domain.schedule.dto.ScheduleCalenderResponse
import org.core.scheduleflow.domain.schedule.dto.ScheduleCreateRequest
import org.core.scheduleflow.domain.schedule.dto.ScheduleDetailResponse
import org.core.scheduleflow.domain.schedule.dto.ScheduleListResponse
import org.core.scheduleflow.domain.schedule.dto.ScheduleUpdateRequest
import org.core.scheduleflow.domain.schedule.entity.Schedule
import org.core.scheduleflow.domain.schedule.entity.ScheduleMember
import org.core.scheduleflow.domain.schedule.repository.ScheduleRepository
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
                val users = userRepository.findAllById(memberIds)
                if (users.size != memberIds.size) {
                    throw CustomException(ErrorCode.NOT_FOUND_USER)
                }
                val scheduleMembers = users.map { user ->
                    ScheduleMember(
                        schedule = savedSchedule,
                        user = user
                    )
                }
                savedSchedule.updateScheduleMembers(scheduleMembers)
            }
        return savedSchedule.id!!
    }

    @Transactional(readOnly = true)
    fun findSchedule(id: Long): ScheduleDetailResponse {
        val schedule = scheduleRepository.findByIdWithAll(id)
            ?: throw CustomException(ErrorCode.NOT_FOUND_SCHEDULE)
        return ScheduleDetailResponse.from(schedule)
    }

    @Transactional(readOnly = true)
    fun findSchedules(
        keyword: String?,
        pageable: Pageable
    ): Page<ScheduleListResponse> {
        if(keyword.isNullOrBlank()){
            return scheduleRepository.findScheduleList(pageable)
        }
        return scheduleRepository.searchScheduleList(keyword, pageable)
    }

    @Transactional(readOnly = true)
    fun findSchedulesByPeriod(startDate: LocalDate, endDate: LocalDate): List<ScheduleCalenderResponse> {
        validatePeriod(startDate, endDate)
        return scheduleRepository.findByStartDateBetween(startDate, endDate)
    }

    @Transactional(readOnly = true)
    fun findMyTask(userId: Long, startDate: LocalDate, endDate: LocalDate): List<ProjectTaskGroup> {
        validatePeriod(startDate, endDate)
        userRepository.findByIdOrNull(userId) ?: throw CustomException(ErrorCode.NOT_FOUND_USER)

        val tasks = scheduleRepository.findMyTasksByUserIdAndPeriod(userId, startDate, endDate)

        return tasks
            .groupBy { it.projectId }
            .map { (projectId, projectTasks) ->
                ProjectTaskGroup(
                    projectId = projectId,
                    projectTitle = projectTasks.first().projectTitle,
                    colorCode = projectTasks.first().colorCode,
                    tasks = projectTasks
                )
            }
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
        if(request.projectId == null){
            schedule.project = null
        } else {
            val project = projectRepository.findByIdOrNull(request.projectId) ?: throw CustomException(ErrorCode.NOT_FOUND_PROJECT)
            schedule.updateProject(project)
        }

        // 멤버 업데이트
        request.memberIds?.let { ids ->
            val users = userRepository.findAllById(ids)
            if (users.size != ids.size) throw CustomException(ErrorCode.NOT_FOUND_USER)

            val newMembers = users.map { ScheduleMember(schedule = schedule, user = it) }
            schedule.updateScheduleMembers(newMembers)
        }

        return ScheduleDetailResponse.from(schedule)
    }

    fun deleteSchedule(id: Long) {
        scheduleRepository.deleteById(id)
    }

    private fun validatePeriod(startDate: LocalDate, endDate: LocalDate) {
        if (startDate.isAfter(endDate)) throw CustomException(ErrorCode.INVALID_PERIOD)
    }
}