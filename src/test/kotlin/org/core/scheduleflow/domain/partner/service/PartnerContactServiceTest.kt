package org.core.scheduleflow.domain.partner.service

import org.core.scheduleflow.domain.partner.dto.PartnerContactRequestDto
import org.core.scheduleflow.domain.partner.entity.Partner
import org.core.scheduleflow.domain.partner.repository.PartnerContactRepository
import org.core.scheduleflow.domain.partner.repository.PartnerRepository
import org.core.scheduleflow.domain.partner.service.PartnerContactService
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest

import org.springframework.context.annotation.Import
import org.springframework.test.context.ActiveProfiles

@DataJpaTest
@ActiveProfiles("test")
@Import(PartnerContactService::class) // 테스트 대상 서비스 주입
class PartnerContactServiceH2Test @Autowired constructor(
    private val partnerRepository: PartnerRepository,
    private val partnerContactRepository: PartnerContactRepository,
    private val partnerContactService: PartnerContactService
) {

    private lateinit var testPartner: Partner

    @BeforeEach
    fun setUp() {
        // 모든 테스트에서 공통으로 사용할 Partner 데이터 저장
        testPartner = partnerRepository.save(Partner(companyName = "메인 파트너사"))
    }

    @Test
    @DisplayName("파트너 연락처 생성 - 성공 시 H2 DB에 저장되고 ID가 발급되어야 한다")
    fun createPartnerContact_Success() {
        // Given
        val request = PartnerContactRequestDto().apply {
            setPartner(testPartner)
            setName("홍길동")
            position = "팀장"
            email = "hong@partner.com"
        }

        // When
        val result = partnerContactService.createPartnerContact(request)

        // Then
        assertNotNull(result.id)
        assertEquals("홍길동", result.name)
        assertEquals(testPartner.id, result.partner?.id)

        // 실제 DB 조회 확인
        val exists = partnerContactRepository.existsById(result.id!!)
        assertTrue(exists)
    }

    @Test
    @DisplayName("파트너 ID로 연락처 조회 - 해당 파트너의 담당자 리스트만 반환해야 한다")
    fun findPartnerContactByPartnerId_Success() {
        // Given
        val contact1 = PartnerContactRequestDto().apply { setPartner(testPartner); setName("담당자1") }
        val contact2 = PartnerContactRequestDto().apply { setPartner(testPartner); setName("담당자2") }
        val otherPartner = partnerRepository.save(Partner(companyName = "다른 회사"))
        val contact3 = PartnerContactRequestDto().apply { setPartner(otherPartner); setName("타사 담당자") }

        partnerContactService.createPartnerContact(contact1)
        partnerContactService.createPartnerContact(contact2)
        partnerContactService.createPartnerContact(contact3)

        // When
        val results = partnerContactService.findPartnerContactByPartnerId(testPartner.id)

        // Then
        assertEquals(2, results.size)
        assertTrue(results.all { it.partner?.id == testPartner.id })
        assertFalse(results.any { it.name == "타사 담당자" })
    }

    @Test
    @DisplayName("유효성 검증 - 이름이 공백인 연락처를 생성하려 하면 예외가 발생한다")
    fun createPartnerContact_Fail_EmptyName() {
        // Given
        val request = PartnerContactRequestDto().apply {
            setPartner(testPartner)
            setName("") // 공백 이름
        }

        // When & Then
        assertThrows(IllegalArgumentException::class.java) {
            partnerContactService.createPartnerContact(request)
        }
    }

    @Test
    @DisplayName("삭제 - 연락처 삭제 시 H2 DB에서 데이터가 제거되어야 한다")
    fun deletePartnerContact_Success() {
        // Given
        val saved = partnerContactService.createPartnerContact(
            PartnerContactRequestDto().apply { setPartner(testPartner); setName("삭제 대상") }
        )

        // When
        partnerContactService.deletePartnerContactById(saved.id!!)

        // Then
        val exists = partnerContactRepository.existsById(saved.id!!)
        assertFalse(exists)
    }
}