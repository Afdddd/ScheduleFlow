package org.core.scheduleflow.domain.partner.service

import org.core.scheduleflow.domain.partner.dto.PartnerRequestDto
import org.core.scheduleflow.domain.partner.dto.PartnerResponseDto
import org.core.scheduleflow.domain.partner.entity.Partner
import org.core.scheduleflow.domain.partner.repository.PartnerRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.*
import java.util.function.Function
import java.util.stream.Collectors

@Service
class PartnerService(private val partnerRepository: PartnerRepository) {
    /*==========================================================Partner READ====================================================================*/
    fun findAll(): List<PartnerResponseDto> {
        val partners = partnerRepository.findAll()

        return partners.mapNotNull { partner ->
            partner?.let { PartnerResponseDto.fromEntity(it) }
        }
    }

    fun findPartnerById(id: Long?): PartnerResponseDto? {
        // id가 null이면 바로 null 반환
        if (id == null) return null

        // findById 대신 findByIdOrNull (Spring Data JPA 확장 함수) 사용 권장
        val partner = partnerRepository.findById(id).orElse(null) ?: return null

        return PartnerResponseDto.fromEntity(partner)
    }

    fun findPartnerByNameContains(companyName: String?): List<PartnerResponseDto> {
        val partners = partnerRepository.findByCompanyNameContains(companyName)

        // mapNotNull을 사용하여 null 요소는 제외하고 DTO로 변환합니다.
        if (partners != null) {
            return partners.mapNotNull { it?.let { partner -> PartnerResponseDto.fromEntity(partner) } }
        }

        return emptyList()
    }

    /*===========================================================Partner CREATE================================================================*/
    @Transactional
    fun createPartner(requestDto: PartnerRequestDto?): PartnerResponseDto {
        /* 유효성 검증 시작 */

        Objects.requireNonNull<PartnerRequestDto?>(requestDto, "요청 데이터(PartnerRequestDto)는 null일 수 없습니다.")
        require(!(requestDto!!.getCompanyName() == null || requestDto.getCompanyName().trim { it <= ' ' }
            .isEmpty())) { "회사 이름은 필수 입력 항목입니다." }

        /* 유효성 검증 끝 */
        val partner = requestDto.toEntity()

        val savedPartner = partnerRepository.save<Partner>(partner)

        return PartnerResponseDto.Companion.fromEntity(savedPartner)
    }

    /*===========================================================Partner UPDATE================================================================*/
    @Transactional
    fun updatePartner(requestDto: PartnerRequestDto?): PartnerResponseDto {
        /* 유효성 검증 시작 */

        Objects.requireNonNull<PartnerRequestDto?>(requestDto, "요청 데이터(PartnerRequestDto)는 null일 수 없습니다.")
        require(!(requestDto!!.getCompanyName() == null || requestDto.getCompanyName().trim { it <= ' ' }
            .isEmpty())) { "회사 이름은 필수 입력 항목입니다." }

        /* 유효성 검증 끝 */
        val partner = requestDto.toEntity()

        val savedPartner = partnerRepository.save<Partner>(partner)

        return PartnerResponseDto.Companion.fromEntity(savedPartner)
    }

    /*==========================================================Partner DELETE=================================================================*/
    @Transactional
    fun deletePartnerById(id: Long) {
        partnerRepository.deleteById(id)
    }
}
