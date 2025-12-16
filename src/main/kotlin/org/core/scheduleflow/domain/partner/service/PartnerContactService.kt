package org.core.scheduleflow.domain.partner.service

import org.core.scheduleflow.domain.partner.dto.PartnerContactRequestDto
import org.core.scheduleflow.domain.partner.dto.PartnerContactResponseDto
import org.core.scheduleflow.domain.partner.dto.PartnerContactResponseDto.Companion.fromEntity
import org.core.scheduleflow.domain.partner.entity.PartnerContact
import org.core.scheduleflow.domain.partner.repository.PartnerContactRepository
import org.springframework.stereotype.Service
import java.util.*
import java.util.stream.Collectors

@Service
class PartnerContactService (
    private val partnerContactRepository: PartnerContactRepository
){


    fun findPartnerContactByPartnerId(partnerId: Long?): List<PartnerContactResponseDto> {
        // 1. id가 null이면 빈 리스트 반환 (안전한 처리)
        if (partnerId == null) return emptyList()

        // 2. 레포지토리가 null이 아님을 보장한다면 !! 대신 주입 방식을 점검하세요.
        // 결과가 null일 수 있다면 ?: emptyList()로 방어 처리를 합니다.
        val partnerContacts = partnerContactRepository?.findByPartnerId(partnerId) ?: emptyList()

        // 3. 간결한 map 변환
        return partnerContacts.mapNotNull { contact ->
            PartnerContactResponseDto.fromEntity(contact)
        }
    }

    fun createPartnerContact(requestDto: PartnerContactRequestDto?): PartnerContactResponseDto {
        /* 유효성 검증 시작 */

        Objects.requireNonNull<PartnerContactRequestDto?>(requestDto, "요청 데이터(PartnerRequestDto)는 null일 수 없습니다.")
        require(!(requestDto!!.getName() == null || requestDto.getName().trim { it <= ' ' }
            .isEmpty())) { "이름은 필수 입력 항목입니다." }

        /* 유효성 검증 끝 */
        val partnerContact = requestDto.toEntity()

        val savedPartnerContact = partnerContactRepository!!.save<PartnerContact>(partnerContact)

        return fromEntity(savedPartnerContact)
    }

    fun updatePartnerContact(requestDto: PartnerContactRequestDto?): PartnerContactResponseDto {
        /* 유효성 검증 시작 */
        Objects.requireNonNull<PartnerContactRequestDto?>(requestDto, "요청 데이터(PartnerRequestDto)는 null일 수 없습니다.")
        require(!(requestDto!!.getName() == null || requestDto.getName().trim { it <= ' ' }
            .isEmpty())) { "이름은 필수 입력 항목입니다." }

        /* 유효성 검증 끝 */
        val partnerContact = requestDto.toEntity()

        val savedPartnerContact = partnerContactRepository!!.save<PartnerContact>(partnerContact)

        return fromEntity(savedPartnerContact)
    }

    fun deletePartnerContactById(id: Long) {
        partnerContactRepository!!.deleteById(id)
    }
}
