package org.core.scheduleflow.domain.project.service

import io.kotest.assertions.throwables.shouldThrow
import io.kotest.core.spec.IsolationMode
import io.kotest.core.spec.style.BehaviorSpec
import io.kotest.matchers.collections.shouldContainAll
import io.kotest.matchers.shouldBe
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.core.scheduleflow.domain.partner.entity.Partner
import org.core.scheduleflow.domain.partner.repository.PartnerContactRepository
import org.core.scheduleflow.domain.partner.repository.PartnerRepository
import org.core.scheduleflow.domain.project.constant.ProjectStatus
import org.core.scheduleflow.domain.project.dto.ProjectCalendarResponse
import org.core.scheduleflow.domain.project.dto.ProjectCreateRequest
import org.core.scheduleflow.domain.project.dto.ProjectUpdateRequest
import org.core.scheduleflow.domain.project.entity.Project
import org.core.scheduleflow.domain.project.entity.ProjectMember
import org.core.scheduleflow.domain.project.repository.ProjectMemberRepository
import org.core.scheduleflow.domain.project.repository.ProjectRepository
import org.core.scheduleflow.domain.schedule.constant.ScheduleType
import org.core.scheduleflow.domain.schedule.dto.ScheduleCalenderResponse
import org.core.scheduleflow.domain.schedule.repository.ScheduleMemberRepository
import org.core.scheduleflow.domain.schedule.repository.ScheduleRepository
import org.core.scheduleflow.domain.user.entity.User
import org.core.scheduleflow.domain.user.repository.UserRepository
import org.core.scheduleflow.global.exception.CustomException
import org.core.scheduleflow.global.exception.ErrorCode
import org.springframework.data.repository.findByIdOrNull
import java.time.LocalDate

class ProjectServiceKoTest() : BehaviorSpec({

    isolationMode = IsolationMode.InstancePerLeaf

    val projectRepository = mockk<ProjectRepository>()
    val partnerRepository = mockk<PartnerRepository>()
    val partnerContactRepository = mockk<PartnerContactRepository>()
    val userRepository = mockk<UserRepository>()
    val projectMemberRepository = mockk<ProjectMemberRepository>()
    val scheduleRepository = mockk<ScheduleRepository>()
    val scheduleMemberRepository = mockk<ScheduleMemberRepository>()

    val projectService = ProjectService(
        projectRepository,
        partnerRepository,
        partnerContactRepository,
        userRepository,
        projectMemberRepository,
        scheduleRepository,
        scheduleMemberRepository
    )

    fun createPartner(id: Long = 1L, companyName: String = "발주처"): Partner {
        return Partner(
            id = id,
            companyName = companyName,
            mainPhone = "02-1234-5678"
        )
    }

    fun createUser(id: Long, username: String, name: String): User {
        return User(
            id = id,
            username = username,
            name = name,
            password = "password",
            phone = "010-0000-0000"
        )
    }

    fun createProjectWithSavedMembers(
        id: Long,
        name: String,
        client: Partner,
        users: List<User>,
        startDate: LocalDate = LocalDate.now(),
        endDate: LocalDate = LocalDate.now().plusDays(30),
        description: String? = null,
        colorCode: String? = null
    ): Project {
        val project = Project(
            id = id,
            name = name,
            client = client,
            startDate = startDate,
            endDate = endDate,
            description = description,
            colorCode = colorCode
        )
        project.updateMembers(users)

        // 저장 후 ID가 설정된 것으로 가정
        val savedMembers = users.mapIndexed { index, user ->
            ProjectMember(
                id = (index + 1).toLong(),
                project = project,
                user = user
            )
        }
        project.members.clear()
        project.members.addAll(savedMembers)

        return project
    }

    fun setupSaveWithMemberIds() {
        every { projectRepository.save(any()) } answers {
            val savedProject = firstArg<Project>()
            // 저장 후 members에 ID 설정 (새 ProjectMember 생성)
            val membersWithId = savedProject.members.mapIndexed { index, member ->
                ProjectMember(
                    id = (index + 1).toLong(),
                    project = savedProject,
                    user = member.user
                )
            }
            savedProject.members.clear()
            savedProject.members.addAll(membersWithId)
            savedProject
        }
    }

    fun setupScheduleMocks() {
        every { scheduleRepository.findByProject(any()) } returns emptyList()
        every { scheduleMemberRepository.findByScheduleIdIn(any()) } returns emptyList()
    }

    Given("정상적인 프로젝트 생성 요청이 주어지고") {
        val request = ProjectCreateRequest(
            name = "test-project",
            clientId = 1L,
            partnerContactIds = emptyList(),
            memberIds = emptyList(),
            status = ProjectStatus.IN_PROGRESS,
            startDate = LocalDate.now(),
            endDate = LocalDate.now().plusDays(10)
        )

        val client = createPartner()
        val user1 = createUser(1L, "user1", "홍길동")
        val user2 = createUser(2L, "user2", "김철수")

        every { projectRepository.existsByName("test-project") } returns false
        every { partnerRepository.findByIdOrNull(1L) } returns client
        every { userRepository.findByIdOrNull(1L) } returns user1
        every { userRepository.findByIdOrNull(2L) } returns user2

        val savedProject = createProjectWithSavedMembers(
            id = 1L,
            name = "test-project",
            client = client,
            users = listOf(user1, user2)
        )

        every { projectRepository.save(any()) } returns savedProject


        When("생성을 하면") {
            val projectId = projectService.createProject(request)

            Then("프로젝트가 생성되고 ID가 반환된다") {
                projectId shouldBe 1L
                verify(exactly = 1) {
                    projectRepository.existsByName("test-project")
                }
                verify(exactly = 1) { projectRepository.save(any()) }
            }
        }

        When("양방향 관계가 올바르게 설정되었는지 확인하면") {
            val projectId = projectService.createProject(request)

            Then("올바르게 설정된다.") {
                savedProject.members.size shouldBe 2
                savedProject.members.first().project.id shouldBe projectId
            }

        }
    }

    Given("중복된 프로젝트 이름으로 생성 요청이 주어지고") {
        val request = ProjectCreateRequest(
            name = "test-project",
            clientId = 1L,
            partnerContactIds = emptyList(),
            memberIds = emptyList(),
            status = ProjectStatus.IN_PROGRESS,
            startDate = LocalDate.now(),
            endDate = LocalDate.now().plusDays(10)
        )

        every { projectRepository.existsByName("test-project") } returns true


        When("생성을 하면") {
            val exception = shouldThrow<CustomException> {
                projectService.createProject(request)
            }
            Then("DUPLICATE_PROJECT 예외가 발생한다.") {
                exception.errorCode shouldBe ErrorCode.DUPLICATE_PROJECT
                verify(exactly = 1) { projectRepository.existsByName("test-project") }
                verify(exactly = 0) { projectRepository.save(any()) }
            }
        }
    }

    Given("존재하지 않는 발주처 ID로 생성 요청이 주어지고") {
        val request = ProjectCreateRequest(
            name = "test-project",
            clientId = 9999L,
            memberIds = emptyList(),
            partnerContactIds = emptyList(),
            startDate = LocalDate.now(),
            endDate = LocalDate.now().plusDays(30)
        )

        every { projectRepository.existsByName("test-project") } returns false
        every { partnerRepository.findByIdOrNull(9999L) } returns null

        When("생성 요청을 하면") {
            val exception = shouldThrow<CustomException> {
                projectService.createProject(request)
            }

            Then("NOT_FOUND_PARTNER 예외가 발생한다") {
                exception.errorCode shouldBe ErrorCode.NOT_FOUND_PARTNER
                verify(exactly = 1) { partnerRepository.findByIdOrNull(9999L) }
                verify(exactly = 0) { projectRepository.save(any()) }
            }
        }
    }

    // ============================================
    // 프로젝트 조회 (Read) 테스트
    // ============================================

    Given("존재하는 프로젝트 ID로 조회 요청이 주어지고") {
        val client = createPartner()
        val user = createUser(1L, "user1", "홍길동")
        val project = createProjectWithSavedMembers(
            id = 1L,
            name = "프로젝트",
            client = client,
            users = listOf(user)
        )

        every { projectRepository.findByIdWithClient(1L) } returns project
        setupScheduleMocks()

        When("조회 요청을 하면") {
            val response = projectService.findProject(1L)

            Then("프로젝트 상세 정보가 반환된다") {
                response.id shouldBe 1L
                response.name shouldBe "프로젝트"
                response.members.size shouldBe 1
                response.members.first().name shouldBe "홍길동"
                verify(exactly = 1) { projectRepository.findByIdWithClient(1L) }
            }
        }
    }

    Given("존재하지 않는 프로젝트 ID로 조회 요청이 주어지고") {
        every { projectRepository.findByIdWithClient(9999L) } returns null

        When("조회 요청을 하면") {
            val exception = shouldThrow<CustomException> {
                projectService.findProject(9999L)
            }

            Then("NOT_FOUND_PROJECT 예외가 발생한다") {
                exception.errorCode shouldBe ErrorCode.NOT_FOUND_PROJECT
                verify(exactly = 1) { projectRepository.findByIdWithClient(9999L) }
            }
        }
    }

    Given("프로젝트 목록 조회 요청이 주어지고") {
        val client = createPartner()
        val user1 = createUser(1L, "user1", "홍길동")
        val user2 = createUser(2L, "user2", "김철수")

        val project1 = createProjectWithSavedMembers(
            id = 1L,
            name = "프로젝트 1",
            client = client,
            users = listOf(user1)
        )

        val project2 = createProjectWithSavedMembers(
            id = 2L,
            name = "프로젝트 2",
            client = client,
            users = listOf(user2),
            endDate = LocalDate.now().plusDays(60)
        )

        every { projectRepository.findAllWithClient() } returns listOf(project1, project2)
        every { projectMemberRepository.findByProjectInWithUser(listOf(project1, project2)) } returns project1.members

        When("조회 요청을 하면") {
            val projects = projectService.findProjects()

            Then("모든 프로젝트 목록이 반환된다") {
                projects.size shouldBe 2
                projects.map { it.name } shouldContainAll listOf("프로젝트 1", "프로젝트 2")
                verify(exactly = 1) { projectRepository.findAllWithClient() }
            }
        }
    }

    // ============================================
    // 프로젝트 수정 (Update) 테스트
    // ============================================

    Given("정상적인 프로젝트 수정 요청이 주어지고") {
        val client = createPartner()
        val user = createUser(1L, "user1", "홍길동")
        val project = createProjectWithSavedMembers(
            id = 1L,
            name = "기존 프로젝트",
            client = client,
            users = listOf(user),
            description = "기존 설명",
            colorCode = "#FF0000"
        )

        val updateRequest = ProjectUpdateRequest(
            name = "수정된 프로젝트",
            description = "수정된 설명",
            colorCode = "#00FF00"
        )

        every { projectRepository.findByIdOrNull(1L) } returns project
        setupSaveWithMemberIds()
        setupScheduleMocks()

        When("수정 요청을 하면") {
            val response = projectService.updateProject(1L, updateRequest)

            Then("프로젝트 정보가 업데이트된다") {
                response.name shouldBe "수정된 프로젝트"
                response.description shouldBe "수정된 설명"
                response.colorCode shouldBe "#00FF00"
                verify(exactly = 1) { projectRepository.findByIdOrNull(1L) }
            }
        }
    }

    Given("프로젝트 멤버 변경 요청이 주어지고") {
        val client = createPartner()
        val user1 = createUser(1L, "user1", "홍길동")
        val user2 = createUser(2L, "user2", "김철수")
        val project = createProjectWithSavedMembers(
            id = 1L,
            name = "프로젝트",
            client = client,
            users = listOf(user1)
        )

        val updateRequest = ProjectUpdateRequest(
            memberIds = listOf(2L)
        )

        every { projectRepository.findByIdOrNull(1L) } returns project
        every { userRepository.findByIdOrNull(2L) } returns user2
        setupSaveWithMemberIds()
        setupScheduleMocks()

        When("수정 요청을 하면") {
            val response = projectService.updateProject(1L, updateRequest)
            Then("멤버가 변경된다") {
                response.members.size shouldBe 1
                response.members.first().name shouldBe "김철수"
                verify(exactly = 1) { userRepository.findByIdOrNull(2L) }
                verify(exactly = 1) { projectRepository.save(any()) }
            }
        }
    }

    Given("존재하지 않는 프로젝트 ID로 수정 요청이 주어지고") {
        val updateRequest = ProjectUpdateRequest(
            name = "수정된 이름"
        )

        every { projectRepository.findByIdOrNull(9999L) } returns null

        When("수정 요청을 하면") {
            val exception = shouldThrow<CustomException> {
                projectService.updateProject(9999L, updateRequest)
            }

            Then("NOT_FOUND_PROJECT 예외가 발생한다") {
                exception.errorCode shouldBe ErrorCode.NOT_FOUND_PROJECT
                verify(exactly = 1) { projectRepository.findByIdOrNull(9999L) }
                verify(exactly = 0) { projectRepository.save(any()) }
            }
        }
    }

    Given("프로젝트 삭제 요청이 주어지고") {
        every { projectRepository.deleteById(1L) } returns Unit

        When("삭제 요청을 하면") {
            projectService.deleteProject(1L)

            Then("프로젝트가 삭제된다") {
                verify(exactly = 1) { projectRepository.deleteById(1L) }
            }
        }
    }

    Given("대시보드 프로젝트 조회 요청이 주어지고") {
        When("startDate가 endDate보다 크다면") {

            val startDate = LocalDate.of(2025, 1, 31)
            val endDate = LocalDate.of(2025, 1, 1)

            val exception = shouldThrow<CustomException> {
                projectService.findProjectsByPeriod(startDate, endDate)
            }

            Then("INVALID_PERIOD 예외가 발생한다.") {
                exception.errorCode shouldBe ErrorCode.INVALID_PERIOD
            }
        }
        When("요청이 정상적이라면") {
            val startDate = LocalDate.of(2025, 1, 1)
            val endDate = LocalDate.of(2025, 1, 31)

            val response1 = ProjectCalendarResponse(
                id = 1L,
                name = "test-project",
                startDate = LocalDate.of(2025, 1, 1),
                endDate = LocalDate.of(2025, 1, 10),
                colorCode = "#FF0000",
                status = ProjectStatus.IN_PROGRESS
            )

            val response2 = ProjectCalendarResponse(
                id = 2L,
                name = "test-project2",
                startDate = LocalDate.of(2025, 1, 12),
                endDate = LocalDate.of(2025, 2, 5),
                colorCode = "#00FF00",
                status = ProjectStatus.ON_HOLD
            )

            every { projectRepository.findByStartDateBetween(startDate, endDate) } returns listOf(response1, response2)

            val result = projectService.findProjectsByPeriod(startDate, endDate)
            Then("프로젝트 정보를 가져온다.") {
                result.size shouldBe 2
                verify(exactly = 1) { projectRepository.findByStartDateBetween(startDate, endDate) }
            }
        }
    }
})