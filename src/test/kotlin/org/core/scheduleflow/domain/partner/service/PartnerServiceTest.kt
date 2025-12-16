package org.core.scheduleflow.domain.partner.service

import org.core.scheduleflow.domain.partner.dto.PartnerRequestDto
import org.core.scheduleflow.domain.partner.repository.PartnerRepository
import org.core.scheduleflow.domain.partner.service.PartnerService
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest
import org.springframework.context.annotation.Import
import org.springframework.test.context.ActiveProfiles

@DataJpaTest // JPA 관련 설정만 로드하여 H2 기반 테스트 환경 구축
@ActiveProfiles("test") // test 프로파일 설정 사용
@Import(PartnerService::class) // Service는 JPA 구성요소가 아니므로 별도 임포트
class PartnerServiceH2Test @Autowired constructor(
    private val partnerRepository: PartnerRepository,
    private val partnerService: PartnerService
) {

    @Test
    @DisplayName("H2 DB에 파트너 저장 시 실제 ID가 생성되어야 한다")
    fun createPartner_RealDbSuccess() {
        // Given
        val request = PartnerRequestDto().apply {
            setCompanyName("H2 테크")
            mainPhone = "010-0000-0000"
        }

        // When
        val result = partnerService.createPartner(request)

        // Then
        assertNotNull(result.id) // H2에 의해 생성된 ID 확인
        assertTrue(result.id!! > 0L)

        val entityInDb = partnerRepository.findById(result.id!!).get()
        assertEquals("H2 테크", entityInDb.companyName)
    }

    @Test
    @DisplayName("이름 검색 시 H2의 LIKE 쿼리가 정상 작동해야 한다")
    fun findByName_LikeQueryTest() {
        // Given
        val req1 = PartnerRequestDto().apply { setCompanyName("Apple") }
        val req2 = PartnerRequestDto().apply { setCompanyName("Application") }
        val req3 = PartnerRequestDto().apply { setCompanyName("Banana") }

        partnerService.createPartner(req1)
        partnerService.createPartner(req2)
        partnerService.createPartner(req3)

        // When
        val result = partnerService.findPartnerByNameContains("App")

        // Then
        assertEquals(2, result.size)
        assertTrue(result.all { it.companyName!!.startsWith("App") })
    }

    @Test
    @DisplayName("삭제 시 데이터베이스에서 실제로 레코드가 제거되어야 한다")
    fun delete_RealDbTest() {
        // Given
        val saved = partnerService.createPartner(PartnerRequestDto().apply { setCompanyName("삭제될놈") })
        val id = saved.id!!

        // When
        partnerService.deletePartnerById(id)

        // Then
        val exists = partnerRepository.existsById(id)
        assertFalse(exists)
    }
}