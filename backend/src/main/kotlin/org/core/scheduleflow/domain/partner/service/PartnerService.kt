package org.core.scheduleflow.domain.partner.service

import org.core.scheduleflow.domain.partner.dto.PartnerRequestDto
import org.core.scheduleflow.domain.partner.dto.PartnerResponseDto
import org.core.scheduleflow.domain.partner.dto.PartnerUpdateRequestDto

import org.core.scheduleflow.domain.partner.repository.PartnerRepository
import org.core.scheduleflow.global.exception.CustomException
import org.core.scheduleflow.global.exception.ErrorCode
import org.springframework.data.repository.findByIdOrNull
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

        return partners.mapNotNull { it?.let { partner -> PartnerResponseDto.fromEntity(partner) } }

    }

    /*===========================================================Partner CREATE================================================================*/

    fun createPartner(partnerRequestDto: PartnerRequestDto): PartnerResponseDto {
        /* 유효성 검증 시작 */

        require(partnerRequestDto.companyName.isNotBlank()) { "회사 이름은 필수 입력 항목입니다." }

        /* 유효성 검증 끝 */
        val partner = partnerRequestDto.toEntity()

        val savedPartner = partnerRepository.save(partner)

        return PartnerResponseDto.fromEntity(savedPartner)
    }

    /*===========================================================Partner UPDATE================================================================*/
    @Transactional
    fun updatePartner(partnerUpdateRequestDto: PartnerUpdateRequestDto): PartnerResponseDto {
        /* 유효성 검증 시작 */


        val partner = partnerRepository.findByIdOrNull(partnerUpdateRequestDto.id) ?: throw CustomException(ErrorCode.NOT_FOUND_PARTNER)


        /* 유효성 검증 끝 */

        partner.companyName = partnerUpdateRequestDto.companyName
        partnerUpdateRequestDto.mainPhone?.let { partner.mainPhone = it }
        partnerUpdateRequestDto.address?.let { partner.address = it }
        partnerUpdateRequestDto.description?.let { partner.description = it }


        val savedPartner = partnerRepository.save(partner)

        return PartnerResponseDto.fromEntity(savedPartner)
    }

    /*==========================================================Partner DELETE=================================================================*/
    @Transactional
    fun deletePartnerById(id: Long) {

        if (!partnerRepository.existsById(id)) {
            throw CustomException(ErrorCode.NOT_FOUND_PARTNER)
        }

        partnerRepository.deleteById(id)
    }
}
