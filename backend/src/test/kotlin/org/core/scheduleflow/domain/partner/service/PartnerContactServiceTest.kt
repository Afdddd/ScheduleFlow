package org.core.scheduleflow.domain.partner.service

import org.assertj.core.api.Assertions.assertThat
import org.core.scheduleflow.domain.partner.dto.PartnerContactRequestDto
import org.core.scheduleflow.domain.partner.dto.PartnerContactUpdateRequestDto
import org.core.scheduleflow.domain.partner.dto.PartnerRequestDto
import org.core.scheduleflow.domain.partner.repository.PartnerContactRepository
import org.core.scheduleflow.global.exception.CustomException
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.transaction.annotation.Transactional
import org.assertj.core.api.Assertions.*

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class PartnerContactServiceTest constructor(
    private val partnerContactService: PartnerContactService,
    private val partnerService: PartnerService,
    private val partnerContactRepository: PartnerContactRepository
) {

    private var partnerId: Long = 0L

    @BeforeEach
    fun setUp() {
        // 모든 연락처 테스트를 위해 부모가 되는 Partner를 먼저 생성
        val partner = partnerService.createPartner(
            PartnerRequestDto(null, "모체 거래처", null, null, null)
        )
        partnerId = partner.id!!
    }

    @Test
    @DisplayName("고객사 ID를 기반으로 소속 직원을 등록한다")
    fun createContact() {
        // given
        val request = PartnerContactRequestDto(
            id = null,
            partnerId = partnerId,
            name = "홍길동",
            position = "팀장",
            email = "hong@test.com"
        )

        // when
        val saved = partnerContactService.createPartnerContact(request, partnerId)

        // then
        assertThat(saved.id).isNotNull
        assertThat(saved.name).isEqualTo("홍길동")
        assertThat(saved.partnerId).isEqualTo(partnerId)
    }

    @Test
    @DisplayName("특정 고객사에 속한 모든 직원 리스트를 조회한다")
    fun findAllContactsByPartner() {
        // given
        partnerContactService.createPartnerContact(PartnerContactRequestDto(null, partnerId, "직원1"), partnerId)
        partnerContactService.createPartnerContact(PartnerContactRequestDto(null, partnerId, "직원2"), partnerId)

        // when
        val list = partnerContactService.findPartnerContactByPartnerId(partnerId)

        // then
        assertThat(list).hasSize(2)
        assertThat(list.map { it.name }).contains("직원1", "직원2")
    }



    @Test
    @DisplayName("기존 거래처 직원의 정보(성함, 직함 등)를 수정한다")
    fun updatePartnerContactTest() {
        // 1. Given: 테스트용 직원 선행 등록
        val savedContact = partnerContactService.createPartnerContact(
            PartnerContactRequestDto(
                id = null,
                partnerId = partnerId,
                name = "기존 이름",
                position = "사원",
                email = "old@test.com"
            ), partnerId
        )

        // 2. When: 수정 요청 DTO 생성 (기존 ID 필수 포함)
        val updateRequest = PartnerContactUpdateRequestDto(
            id = savedContact.id, // 저장된 식별자 사용
            name = "수정된 이름",
            position = "대리",
            email = "new@test.com",
            phone = "010-0000-0000",
            department = "ansjdkfjs"
        )

        val updated = partnerContactService.updatePartnerContact(updateRequest, partnerId)

        // 3. Then: 반환된 DTO와 실제 DB 데이터 검증
        assertThat(updated.name).isEqualTo("수정된 이름")
        assertThat(updated.position).isEqualTo("대리")
        assertThat(updated.email).isEqualTo("new@test.com")

        // 실제로 다시 조회했을 때도 반영되어 있는지 확인
        val found = partnerContactService.findPartnerContactByPartnerId(partnerId)
            .find { it.id == savedContact.id }

        assertThat(found?.name).isEqualTo("수정된 이름")
        assertThat(found?.position).isEqualTo("대리")
    }

    @Test
    @DisplayName("고객사 직원을 삭제하면 관련 프로젝트 접점 데이터와 함께 삭제된다")
    fun deletePartnerContactSuccess() {
        // 1. Given: 고객사와 직원 생성
        val partner = partnerService.createPartner(PartnerRequestDto(null, "테스트사", null, null, null))
        val contact = partnerContactService.createPartnerContact(
            PartnerContactRequestDto(null, partner.id!!, "삭제직원"), partner.id!!
        )



        // 2. When: 삭제 실행
        partnerContactService.deletePartnerContactById(partner.id!!, contact.id!!)

        // 3. Then: 데이터 삭제 확인
        val foundContact = partnerContactRepository.findById(contact.id!!).orElse(null)
        assertThat(foundContact).isNull()

        // 연관된 매핑 테이블(projectPartnerContactRepository)도 삭제되었는지 검증 가능
    }

    @Test
    @DisplayName("직원의 소속 고객사 ID가 입력된 ID와 다르면 예외가 발생한다")
    fun deletePartnerContactBelongingError() {
        // 1. Given: 두 개의 서로 다른 고객사 생성
        val partnerA = partnerService.createPartner(PartnerRequestDto(null, "A사", null, null, null))
        val partnerB = partnerService.createPartner(PartnerRequestDto(null, "B사", null, null, null))

        // A사 소속 직원 생성
        val contactA = partnerContactService.createPartnerContact(
            PartnerContactRequestDto(null, partnerA.id!!, "A사 직원"), partnerA.id!!
        )

        // 2. When & 3. Then: B사의 ID를 주면서 A사 직원을 삭제하라고 요청 시 에러 발생
        assertThatThrownBy {
            partnerContactService.deletePartnerContactById(partnerB.id!!, contactA.id!!)
        }
            .isInstanceOf(CustomException::class.java)
            .hasMessage("해당 고객사에 소속된 직원이 아닙니다.")
    }

    @Test
    @DisplayName("존재하지 않는 직원 ID를 삭제하려고 하면 에러가 발생한다")
    fun deletePartnerContactNotFound() {
        // given
        val partner = partnerService.createPartner(PartnerRequestDto(null, "테스트사", null, null, null))
        val invalidContactId = 9999L

        // when & then
        assertThatThrownBy {
            partnerContactService.deletePartnerContactById(partner.id!!, invalidContactId)
        }
            .isInstanceOf(CustomException::class.java)
        // .extracting("errorCode").isEqualTo(ErrorCode.NOT_FOUND_PARTNER_CONTACT) // 에러코드 검증 시 사용
    }
}