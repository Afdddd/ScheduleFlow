package org.core.scheduleflow.domain.partner.service

import org.assertj.core.api.Assertions.assertThat
import org.core.scheduleflow.domain.partner.dto.PartnerContactRequestDto
import org.core.scheduleflow.domain.partner.dto.PartnerRequestDto
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.transaction.annotation.Transactional

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class PartnerContactServiceTest @Autowired constructor(
    private val partnerContactService: PartnerContactService,
    private val partnerService: PartnerService
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
        val updateRequest = PartnerContactRequestDto(
            id = savedContact.id, // 저장된 식별자 사용
            partnerId = partnerId,
            name = "수정된 이름",
            position = "대리",
            email = "new@test.com",
            phone = "010-0000-0000"
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
}