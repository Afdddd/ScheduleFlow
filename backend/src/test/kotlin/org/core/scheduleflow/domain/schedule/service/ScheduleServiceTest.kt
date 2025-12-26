package org.core.scheduleflow.domain.schedule.service

import io.kotest.assertions.throwables.shouldThrow
import io.kotest.core.spec.IsolationMode
import io.kotest.core.spec.style.BehaviorSpec
import io.kotest.matchers.shouldBe
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.core.scheduleflow.domain.partner.entity.Partner
import org.core.scheduleflow.domain.project.entity.Project
import org.core.scheduleflow.domain.project.repository.ProjectRepository
import org.core.scheduleflow.domain.schedule.constant.ScheduleType
import org.core.scheduleflow.domain.schedule.dto.ScheduleCreateRequest
import org.core.scheduleflow.domain.schedule.dto.ScheduleUpdateRequest
import org.core.scheduleflow.domain.schedule.entity.Schedule
import org.core.scheduleflow.domain.schedule.repository.ScheduleRepository
import org.core.scheduleflow.domain.user.entity.User
import org.core.scheduleflow.domain.user.repository.UserRepository
import org.core.scheduleflow.global.exception.CustomException
import org.core.scheduleflow.global.exception.ErrorCode
import org.springframework.data.repository.findByIdOrNull
import java.time.LocalDate

class ScheduleServiceTest : BehaviorSpec({

    isolationMode = IsolationMode.InstancePerLeaf

    val scheduleRepository = mockk<ScheduleRepository>()
    val projectRepository = mockk<ProjectRepository>()
    val userRepository = mockk<UserRepository>()
    val service = ScheduleService(scheduleRepository, projectRepository, userRepository)

    val mockClient = mockk<Partner>()

    val mockProject = Project(
        id = 1L,
        client = mockClient,
        name = "test-project",
        startDate = LocalDate.now(),
        endDate = LocalDate.now().plusDays(10)
    )

    val mockUser = User(
        id = 10L,
        username = "user10",
        password = "password",
        name = "test-user",
        phone = "010-0000-0000",
        position = "developer"
    )

    Given("일정 생성 요청이 주어지고") {

        val request = ScheduleCreateRequest(
            title = "test-schedule",
            startDate = LocalDate.now(),
            endDate = LocalDate.now().plusDays(10),
            projectId = 1L,
            memberIds = listOf(10L, 20L)
        )

        val savedSchedule = Schedule(
            id = 1L,
            title = "test-schedule",
            startDate = LocalDate.now(),
            endDate = LocalDate.now().plusDays(10),
        )
        When("존재하지 않는 project Id가 전달되면") {
            every { scheduleRepository.save(any()) } returns savedSchedule
            every { projectRepository.findByIdOrNull(1L) } returns null

            Then("NOT_FOUND_PROJECT 예외가 발생한다") {
                shouldThrow<CustomException> {
                    service.createSchedule(request)
                }.errorCode shouldBe ErrorCode.NOT_FOUND_PROJECT
            }
        }

        When("일부 사원 ID가 유효하지 않아도") {
            // 10L은 있고, 20L은 DB에 없는 상황
            every { scheduleRepository.save(any()) } returns savedSchedule
            every { projectRepository.findByIdOrNull(1L) } returns mockProject
            every { userRepository.findAllById(listOf(10L, 20L)) } returns listOf(mockUser)

            val resultId = service.createSchedule(request)

            Then("존재하는 사원(1명)만 등록되고 일정이 생성된다") {
                resultId shouldBe 1L
            }
        }
    }

    Given("ID로 일정 조회 요청이 주어질 때") {

        val requestId = 1L
        val mockSchedule = Schedule(
            id = requestId,
            title = "test-schedule",
            startDate = LocalDate.now(),
            endDate = LocalDate.now().plusDays(10),
            project = mockProject
        )

        When("주어진 ID에 해당하는 일정이 존재하면") {
            every { scheduleRepository.findByIdWithProject(requestId) } returns mockSchedule

            val result = service.findSchedule(requestId)

            Then("일정 상세 정보가 반환된다.") {
                result.id shouldBe requestId
                result.title shouldBe "test-schedule"
                result.projectId shouldBe 1L
                verify(exactly = 1) { scheduleRepository.findByIdWithProject(any()) }
            }
        }

        When("주어진 ID에 해당하는 일정이 없을 경우") {
            every { scheduleRepository.findByIdWithProject(requestId) } returns null
            val exception = shouldThrow<CustomException> {
                service.findSchedule(requestId)
            }
            Then("NOT_FOUND_SCHEDULE 예외가 발생한다.") {
                exception.errorCode shouldBe ErrorCode.NOT_FOUND_SCHEDULE
                verify(exactly = 1) { scheduleRepository.findByIdWithProject(requestId) }
            }
        }
    }

    Given("일정 목록 조회 요청이 주어질 때") {

        val mockSchedules = listOf(
            Schedule(
                id = 1L,
                title = "일정 1",
                startDate = LocalDate.now(),
                endDate = LocalDate.now().plusDays(1),
                type = ScheduleType.PROJECT
            ),
            Schedule(
                id = 2L,
                title = "일정 2",
                startDate = LocalDate.now(),
                endDate = LocalDate.now().plusDays(2),
                type = ScheduleType.TEST_RUN
            )
        )

        When("저장된 일정들이 존재하면") {
            every { scheduleRepository.findAllWithProject() } returns mockSchedules

            val result = service.findSchedules()

            Then("모든 일정의 요약 정보 목록을 반환한다.") {
                result.size shouldBe 2
                result[0].id shouldBe 1L
                result[0].title shouldBe "일정 1"
                result[1].id shouldBe 2L
                result[1].title shouldBe "일정 2"

                verify(exactly = 1) { scheduleRepository.findAllWithProject() }
            }
        }

        When("저장된 일정이 하나도 없을 경우") {
            every { scheduleRepository.findAllWithProject() } returns emptyList()

            val result = service.findSchedules()

            Then("빈 리스트를 반환한다.") {
                result.size shouldBe 0
                result shouldBe emptyList()
            }
        }
    }

    Given("일정 수정 요청이 주어질 때") {
        val scheduleId = 1L
        val existingSchedule = Schedule(
            id = scheduleId,
            title = "기존 제목",
            startDate = LocalDate.now(),
            endDate = LocalDate.now().plusDays(1),
            type = ScheduleType.PROJECT
        )

        val updateRequest = ScheduleUpdateRequest(
            title = "수정된 제목",
            startDate = null, // 유지
            endDate = null,   // 유지
            scheduleType = ScheduleType.PROJECT,
            projectId = 100L,
            memberIds = listOf(10L)
        )

        When("모든 데이터가 유효하다면") {
            every { scheduleRepository.findByIdOrNull(scheduleId) } returns existingSchedule
            every { projectRepository.findByIdOrNull(100L) } returns mockProject
            every { userRepository.findAllById(listOf(10L)) } returns listOf(mockUser)

            val result = service.updateSchedule(scheduleId, updateRequest)

            Then("요청된 필드만 수정되고 상세 정보가 반환된다") {
                result.title shouldBe "수정된 제목"

                result.startDate shouldBe existingSchedule.startDate

                val memberDto = result.members[0]
                memberDto.id shouldBe 0L
                memberDto.name shouldBe "test-user"

                verify { scheduleRepository.findByIdOrNull(scheduleId) }
                verify { userRepository.findAllById(listOf(10L)) }
            }
        }

        When("수정하려는 프로젝트 ID가 존재하지 않으면") {
            every { scheduleRepository.findByIdOrNull(scheduleId) } returns existingSchedule
            every { projectRepository.findByIdOrNull(100L) } returns null

            val exception = shouldThrow<CustomException> {
                service.updateSchedule(scheduleId, updateRequest)
            }

            Then("NOT_FOUND_PROJECT 예외가 발생한다") {
                exception.errorCode shouldBe ErrorCode.NOT_FOUND_PROJECT
            }
        }
    }
})