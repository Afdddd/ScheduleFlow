package org.core.scheduleflow.domain.partner.service

import org.assertj.core.api.Assertions.assertThat
import org.core.scheduleflow.domain.partner.dto.PartnerRequestDto
import org.core.scheduleflow.domain.partner.dto.PartnerUpdateRequestDto
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.data.domain.Pageable
import org.springframework.test.context.ActiveProfiles
import org.springframework.transaction.annotation.Transactional

@SpringBootTest
@ActiveProfiles("test") // application-test.yml을 사용하도록 설정
@Transactional          // 테스트 후 자동 롤백 (H2 데이터 초기화)
class PartnerServiceTest @Autowired constructor(
    private val partnerService: PartnerService
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
}