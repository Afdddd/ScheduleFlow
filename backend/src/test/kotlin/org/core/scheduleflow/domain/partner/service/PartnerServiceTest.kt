package org.core.scheduleflow.domain.partner.service

import org.assertj.core.api.Assertions.assertThat
import org.core.scheduleflow.domain.partner.dto.PartnerContactRequestDto
import org.core.scheduleflow.domain.partner.dto.PartnerRequestDto
import org.core.scheduleflow.domain.partner.dto.PartnerUpdateRequestDto
import org.core.scheduleflow.domain.partner.repository.PartnerContactRepository
import org.core.scheduleflow.domain.partner.repository.PartnerRepository
import org.core.scheduleflow.domain.project.constant.ProjectStatus
import org.core.scheduleflow.domain.project.dto.ProjectCreateRequest
import org.core.scheduleflow.domain.project.entity.Project
import org.core.scheduleflow.domain.project.service.ProjectService
import org.core.scheduleflow.domain.user.entity.User
import org.core.scheduleflow.domain.user.repository.UserRepository
import org.core.scheduleflow.global.exception.CustomException
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.data.domain.Pageable
import org.springframework.test.context.ActiveProfiles
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import org.assertj.core.api.Assertions.*

@SpringBootTest
@ActiveProfiles("test") // application-test.yml을 사용하도록 설정
@Transactional          // 테스트 후 자동 롤백 (H2 데이터 초기화)
class PartnerServiceTest @Autowired constructor(
    private val partnerService: PartnerService,
    @Autowired private val partnerContactService: PartnerContactService,
    @Autowired private val partnerRepository: PartnerRepository,
    @Autowired private val partnerContactRepository: PartnerContactRepository,
    @Autowired private val projectService: ProjectService,
    @Autowired private val userRepository: UserRepository
) {

    @Test
    @DisplayName("고객사 정보를 저장하고 ID로 다시 조회한다")
    fun saveAndFindPartner() {
        // given
        val request = PartnerRequestDto(
            id = null,
            companyName = "테스트 컴퍼니",
            mainPhone = "010-1234-5678",
            address = "서울시 강남구",
            description = "테스트용 업체"
        )

        // when
        val saved = partnerService.createPartner(request)
        val found = partnerService.findPartnerById(saved.id!!)

        // then
        assertThat(found).isNotNull
        assertThat(found?.companyName).isEqualTo("테스트 컴퍼니")
    }

    @Test
    @DisplayName("기존 고객사의 정보를 수정하면 변경 사항이 반영되어야 한다")
    fun updatePartner() {
        // given
        val initial = partnerService.createPartner(
            PartnerRequestDto(null, "초기이름", null, null, null)
        )

        // when (ID를 포함하여 요청)
        val updateRequest = PartnerUpdateRequestDto(
            id = initial.id!!,
            companyName = "수정된이름",
            mainPhone = "02-111-2222",
            address = initial.address,
            description = "설명 추가"
        )
        val updated = partnerService.updatePartner(updateRequest)

        // then
        assertThat(updated.companyName).isEqualTo("수정된이름")
        assertThat(updated.mainPhone).isEqualTo("02-111-2222")
    }

    @Test
    @DisplayName("고객사 조회")
    fun findPartners() {
        // given
        val request1 = PartnerRequestDto(
            id = null,
            companyName = "테스트 컴퍼니",
            mainPhone = "010-1234-5678",
            address = "서울시 강남구",
            description = "테스트용 업체"
        )

        val request2 = PartnerRequestDto(
            id = null,
            companyName = "김앵도",
            mainPhone = "010-8689-5678",
            address = "서울시 강서구",
            description = "억만장자"
        )

        val request3 = PartnerRequestDto(
            id = null,
            companyName = "테스트 김앵도",
            mainPhone = "010-8689-5678",
            address = "서울시 구로구",
            description = "억만장자"
        )

        // when
        val saved1 = partnerService.createPartner(request1)
        val saved2 = partnerService.createPartner(request2)
        val saved3 = partnerService.createPartner(request3)

        // keyword = null
        val pageable: Pageable = Pageable.ofSize(5)
        var keyword: String? = null
        val found1 = partnerService.findPartners(pageable, keyword)

        keyword = "테스트"
        val found2 = partnerService.findPartners(pageable, keyword)



        assertThat(found1.content.size).isEqualTo(3)
        assertThat(found2.content.size).isEqualTo(2)


    }

    @Test
    @DisplayName("연결된 프로젝트가 없으면 파트너와 소속 직원들이 모두 삭제된다")
    fun deletePartnerSuccess() {
        // given
        val request1 = PartnerRequestDto(
            id = null,
            companyName = "테스트 컴퍼니",
            mainPhone = "010-1234-5678",
            address = "서울시 강남구",
            description = "테스트용 업체"
        )
        val partner = partnerService.createPartner(request1)

        partnerContactService.createPartnerContact(
            PartnerContactRequestDto(
                id = null,
                partnerId = partner.id!!,
                name = "기존 이름",
                position = "사원",
                email = "old@test.com"
            ), partner.id
        )

        partnerContactService.createPartnerContact(
            PartnerContactRequestDto(
                id = null,
                partnerId = partner.id,
                name = "김영도",
                position = "사원",
                email = "old@test.com"
            ), partner.id
        )

        // 2. When: 삭제 실행
        partnerService.deletePartnerById(partner.id)

        // 3. Then: 파트너와 직원 모두 조회되지 않아야 함
        assertThat(partnerRepository.findById(partner.id)).isEmpty()
        assertThat(partnerContactRepository.findByPartnerId(partner.id)).isEmpty()

    }

    @Test
    @DisplayName("연결된 프로젝트가 존재하면 파트너 삭제 시 예외가 발생한다")
    fun deletePartnerFailWithProject() {
        // given
        val request1 = PartnerRequestDto(
            id = null,
            companyName = "테스트 컴퍼니",
            mainPhone = "010-1234-5678",
            address = "서울시 강남구",
            description = "테스트용 업체"
        )
        val partner = partnerService.createPartner(request1)

        val partnerContact1 = partnerContactService.createPartnerContact(
            PartnerContactRequestDto(
                id = null,
                partnerId = partner.id!!,
                name = "기존 이름",
                position = "사원",
                email = "old@test.com"
            ), partner.id
        )

        val partnerContact2 = partnerContactService.createPartnerContact(
            PartnerContactRequestDto(
                id = null,
                partnerId = partner.id,
                name = "김영도",
                position = "사원",
                email = "old@test.com"
            ), partner.id
        )

        val partnerIdArray = arrayOf(partnerContact1.id!!, partnerContact2.id!!)

        val user = userRepository.save(
            User(
                username = "test-user-name",
                password = "test-password",
                name = "test-user",
                email = "test@example.com",
                phone = "010-0000-0000",
                position = "developer"
            )
        )

        val userIdArray = arrayOf(user.id!!)

        val projectCreateRequest = ProjectCreateRequest(
            name = "테스트 프로젝트",
            clientId = partner.id,
            partnerContactIds = partnerIdArray.toList(),
            memberIds = userIdArray.toList(),
            status = ProjectStatus.IN_PROGRESS,
            startDate = LocalDate.now(),
            endDate = LocalDate.now()
        )

        projectService.createProject(projectCreateRequest)


        // 2. When & 3. Then: 삭제 시도 시 PARTNER_HAS_RELATED_PROJECT 예외 발생 검증
        assertThatThrownBy { partnerService.deletePartnerById(partner.id) }
            .isInstanceOf(CustomException::class.java)
        // ErrorCode.PARTNER_HAS_RELATED_PROJECT의 메시지나 코드를 검증
    }

    @Test
    @DisplayName("존재하지 않는 파트너 ID를 삭제하려고 하면 예외가 발생한다")
    fun deletePartnerFailNotFound() {
        // given
        val invalidId = 9999L

        // when & then
        assertThatThrownBy { partnerService.deletePartnerById(invalidId) }
            .isInstanceOf(CustomException::class.java)
    }
}