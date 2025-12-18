package org.core.scheduleflow.domain.project.service

import org.core.scheduleflow.domain.partner.repository.PartnerContactRepository
import org.core.scheduleflow.domain.partner.repository.PartnerRepository
import org.core.scheduleflow.domain.project.constant.ProjectStatus
import org.core.scheduleflow.domain.project.dto.ProjectCreateRequest
import org.core.scheduleflow.domain.project.entity.Project
import org.core.scheduleflow.domain.project.entity.ProjectMembers
import org.core.scheduleflow.domain.project.entity.ProjectPartnerContact
import org.core.scheduleflow.domain.project.repository.ProjectMemberRepository
import org.core.scheduleflow.domain.project.repository.ProjectPartnerContactRepository
import org.core.scheduleflow.domain.project.repository.ProjectRepository
import org.core.scheduleflow.domain.user.repository.UserRepository
import org.core.scheduleflow.global.exception.CustomException
import org.core.scheduleflow.global.exception.ErrorCode
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class ProjectService(
    private val projectRepository: ProjectRepository,
    private val partnerRepository: PartnerRepository,
    private val partnerContactRepository: PartnerContactRepository,
    private val userRepository: UserRepository,
    private val projectMemberRepository: ProjectMemberRepository,
    private val projectPartnerContactRepository: ProjectPartnerContactRepository
) {

    @Transactional
    fun createProject(request: ProjectCreateRequest): Long {
        // 이름 중복 조회
        validateProjectName(request.name)

        // 프로젝트 생성
        val project = Project(
            name = request.name,
            description = request.description,
            startDate = request.startDate,
            endDate = request.endDate,
            status = request.status ?: ProjectStatus.IN_PROGRESS,
            colorCode = request.colorCode
        )
        val savedProject = projectRepository.save(project)

        // 발주처 할당
        val client = partnerRepository.findByIdOrNull(request.clientId)
            ?: throw CustomException(ErrorCode.NOT_FOUND_PARTNER)
        savedProject.updateClient(client)

        // 직원 할당
        val projectMembers = request.projectManagerIds.map { id ->
            val user = userRepository.findByIdOrNull(id)
                ?: throw CustomException(ErrorCode.NOT_FOUND_USER)
            ProjectMembers(project = project, user = user)
        }
        projectMemberRepository.saveAll(projectMembers)

        // 협력 지원 할당
        val projectPartnerContacts = request.partnerContactIds.map { id ->
            val partnerContact = partnerContactRepository.findByIdOrNull(id)
                ?: throw CustomException(ErrorCode.NOT_FOUND_PARTNER_CONTACT)
            ProjectPartnerContact(project = savedProject, partnerContact = partnerContact)
        }
        projectPartnerContactRepository.saveAll(projectPartnerContacts)

        return savedProject.id!!
    }

    private fun validateProjectName(name: String) {
        if(projectRepository.existsByName(name)){
            throw CustomException(ErrorCode.DUPLICATE_PROJECT)
        }
    }
}