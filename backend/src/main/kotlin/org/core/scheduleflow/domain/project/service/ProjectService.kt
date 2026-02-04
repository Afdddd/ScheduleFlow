package org.core.scheduleflow.domain.project.service

import org.core.scheduleflow.domain.partner.dto.ProjectPartnerContactDto
import org.core.scheduleflow.domain.partner.repository.PartnerContactRepository
import org.core.scheduleflow.domain.partner.repository.PartnerRepository
import org.core.scheduleflow.domain.project.constant.ProjectStatus
import org.core.scheduleflow.domain.project.dto.ProjectCalendarResponse
import org.core.scheduleflow.domain.project.dto.ProjectCalendarWithSchedulesResponse
import org.core.scheduleflow.domain.project.dto.ProjectCreateRequest
import org.core.scheduleflow.domain.project.dto.ProjectDetailResponse
import org.core.scheduleflow.domain.project.dto.ProjectListResponse
import org.core.scheduleflow.domain.project.dto.ProjectUpdateRequest
import org.core.scheduleflow.domain.project.entity.Project
import org.core.scheduleflow.domain.project.repository.ProjectRepository
import org.core.scheduleflow.domain.schedule.dto.ProjectScheduleDto
import org.core.scheduleflow.domain.schedule.repository.ScheduleMemberRepository
import org.core.scheduleflow.domain.schedule.repository.ScheduleRepository
import org.core.scheduleflow.domain.user.dto.ProjectMemberDto
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
class ProjectService(
    private val projectRepository: ProjectRepository,
    private val partnerRepository: PartnerRepository,
    private val partnerContactRepository: PartnerContactRepository,
    private val userRepository: UserRepository,
    private val scheduleRepository: ScheduleRepository,
    private val scheduleMemberRepository: ScheduleMemberRepository,
) {

    fun createProject(request: ProjectCreateRequest): Long {
        validateProjectName(request.name)

        val client = partnerRepository.findByIdOrNull(request.clientId)
            ?: throw CustomException(ErrorCode.NOT_FOUND_PARTNER)

        val users = request.memberIds.map { id ->
            userRepository.findByIdOrNull(id)
                ?: throw CustomException(ErrorCode.NOT_FOUND_USER)
        }

        val partnerContacts = request.partnerContactIds.map { id ->
            partnerContactRepository.findByIdOrNull(id)
                ?: throw CustomException(ErrorCode.NOT_FOUND_PARTNER_CONTACT)
        }

        val project = Project(
            name = request.name,
            description = request.description,
            startDate = request.startDate,
            endDate = request.endDate,
            status = request.status ?: ProjectStatus.IN_PROGRESS,
            colorCode = request.colorCode,
            client = client
        )

        project.updateMembers(users)
        project.updateContacts(partnerContacts)

        val savedProject = projectRepository.save(project)
        return savedProject.id!!
    }

    @Transactional(readOnly = true)
    fun findProject(projectId: Long): ProjectDetailResponse {
        val project = projectRepository.findByIdWithClient(projectId)
            ?: throw CustomException(ErrorCode.NOT_FOUND_PROJECT)

        return toProjectDetailResponse(project)
    }

    @Transactional(readOnly = true)
    fun findProjects(
        keyword: String?,
        pageable: Pageable
    ): Page<ProjectListResponse> {
        if(keyword.isNullOrBlank()) {
            return projectRepository.findProjectList(pageable)
        }
        return projectRepository.searchProjectList(keyword, pageable)
    }

    @Transactional(readOnly = true)
    fun findProjectsByPeriodWithSchedules(startDate: LocalDate, endDate: LocalDate)
    :List<ProjectCalendarWithSchedulesResponse>  {
        if (startDate.isAfter(endDate)) { throw CustomException(ErrorCode.INVALID_PERIOD) }
        val projects = projectRepository.findByStartDateBetweenWithSchedules(startDate, endDate)
        return projects.map { project ->
            ProjectCalendarWithSchedulesResponse.from(project)
        }
    }

    @Transactional(readOnly = true)
    fun findProjectsByPeriod(startDate: LocalDate, endDate: LocalDate): List<ProjectCalendarResponse> {
        if (startDate.isAfter(endDate)) { throw CustomException(ErrorCode.INVALID_PERIOD) }
        return projectRepository.findByStartDateBetween(startDate, endDate)
    }

    fun updateProject(projectId: Long, request: ProjectUpdateRequest): ProjectDetailResponse {
        val project = projectRepository.findByIdOrNull(projectId)
            ?: throw CustomException(ErrorCode.NOT_FOUND_PROJECT)

        request.name?.let { project.name = it }
        request.description?.let { project.description = it }
        request.startDate?.let { project.startDate = it }
        request.endDate?.let { project.endDate = it }
        request.status?.let { project.status = it }
        request.colorCode?.let { project.colorCode = it }

        request.clientId?.let { clientId ->
            val client = partnerRepository.findByIdOrNull(clientId)
                ?: throw CustomException(ErrorCode.NOT_FOUND_PARTNER)
            project.updateClient(client)
        }

        request.memberIds?.let { memberIds ->
            val users = memberIds.map { id ->
                userRepository.findByIdOrNull(id)
                    ?: throw CustomException(ErrorCode.NOT_FOUND_USER)
            }
            project.updateMembers(users)
        }

        request.partnerContactIds?.let { contactIds ->
            val partnerContacts = contactIds.map { id ->
                partnerContactRepository.findByIdOrNull(id)
                    ?: throw CustomException(ErrorCode.NOT_FOUND_PARTNER_CONTACT)
            }
            project.updateContacts(partnerContacts)
        }

        return toProjectDetailResponse(projectRepository.save(project))
    }

    fun deleteProject(projectId: Long) {
        val project = projectRepository.findByIdOrNull(projectId)
            ?: throw CustomException(ErrorCode.NOT_FOUND_PROJECT)

        // 프로젝트 삭제 (cascade로 schedules, members, contacts, files 모두 삭제)
        projectRepository.delete(project)
    }

    private fun toProjectDetailResponse(project: Project): ProjectDetailResponse {
        val members = project.members.map { ProjectMemberDto.from(it) }

        val contacts = project.contacts.map { ProjectPartnerContactDto.from(it) }

        val schedules = scheduleRepository.findByProject(project)
        val scheduleIds = schedules.mapNotNull { it.id }

        val scheduleMembers = if (scheduleIds.isNotEmpty()) {
            scheduleMemberRepository.findByScheduleIdIn(scheduleIds)
        } else {
            emptyList()
        }

        val membersByScheduleId = scheduleMembers.groupBy { it.schedule.id }

        val scheduleDtoList = schedules.map { schedule ->
            val scheduleMemberList = membersByScheduleId[schedule.id] ?: emptyList()
            val memberNames = scheduleMemberList.map { it.user.name }
            ProjectScheduleDto.from(schedule, memberNames)
        }

        return ProjectDetailResponse.from(project, contacts, members, scheduleDtoList)
    }

    private fun validateProjectName(name: String) {
        if (projectRepository.existsByName(name)) {
            throw CustomException(ErrorCode.DUPLICATE_PROJECT)
        }
    }
}