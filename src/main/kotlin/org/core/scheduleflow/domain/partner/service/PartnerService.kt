package org.core.scheduleflow.domain.partner.service

import org.core.scheduleflow.domain.partner.dto.PartnerRequestDto
import org.core.scheduleflow.domain.partner.dto.PartnerResponseDto

import org.core.scheduleflow.domain.partner.repository.PartnerRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional


@Service
@Transactional
class PartnerService(private val partnerRepository: PartnerRepository) {
    /*==========================================================Partner READ====================================================================*/
    fun findAll(): List<PartnerResponseDto> {
        val partners = partnerRepository.findAll()

        return partners.mapNotNull { partner ->
            partner?.let { PartnerResponseDto.fromEntity(it) }
        }
    }

    fun findPartnerById(id: Long): PartnerResponseDto? {

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

    fun createPartner(partnerRequestDto: PartnerRequestDto): PartnerResponseDto {
        /* 유효성 검증 시작 */

        require(!(partnerRequestDto.companyName.trim { it <= ' ' }.isEmpty())) { "회사 이름은 필수 입력 항목입니다." }

        /* 유효성 검증 끝 */
        val partner = partnerRequestDto.toEntity()

        val savedPartner = partnerRepository.save(partner)

        return PartnerResponseDto.fromEntity(savedPartner)
    }

    /*===========================================================Partner UPDATE================================================================*/
    @Transactional
    fun updatePartner(partnerRequestDto: PartnerRequestDto): PartnerResponseDto {
        /* 유효성 검증 시작 */

        val partnerId = partnerRequestDto.id ?: throw IllegalArgumentException("수정 시 ID는 필수입니다.")

        partnerRepository.findById(partnerId).orElseThrow() {IllegalArgumentException("존재하지 않는 고객사 입니다")}


        /* 유효성 검증 끝 */
        val partner = partnerRequestDto.toEntity()

        val savedPartner = partnerRepository.save(partner)

        return PartnerResponseDto.fromEntity(savedPartner)
    }

    /*==========================================================Partner DELETE=================================================================*/
    @Transactional
    fun deletePartnerById(id: Long) {
        partnerRepository.deleteById(id)
    }
}
