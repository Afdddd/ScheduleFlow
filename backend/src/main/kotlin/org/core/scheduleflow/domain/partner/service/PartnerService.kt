package org.core.scheduleflow.domain.partner.service

import org.core.scheduleflow.domain.partner.dto.PartnerListResponse
import org.core.scheduleflow.domain.partner.dto.PartnerRequestDto
import org.core.scheduleflow.domain.partner.dto.PartnerResponseDto
import org.core.scheduleflow.domain.partner.dto.PartnerUpdateRequestDto

import org.core.scheduleflow.domain.partner.repository.PartnerRepository
import org.core.scheduleflow.global.exception.CustomException
import org.core.scheduleflow.global.exception.ErrorCode
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional


@Service
@Transactional
class PartnerService(private val partnerRepository: PartnerRepository) {
    /*==========================================================Partner READ====================================================================*/
    @Transactional(readOnly = true)
    fun findPartners(pageable: Pageable, keyword: String?): Page<PartnerListResponse> {

        if(!keyword.isNullOrBlank()) {
            return partnerRepository.findByCompanyNameContains(pageable,keyword)
        }

        return partnerRepository.findPartners(pageable)
    }

    fun findPartnerById(id: Long): PartnerResponseDto? {

        val partner = partnerRepository.findById(id).orElse(null) ?: return null

        return PartnerResponseDto.fromEntity(partner)
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
        
        partnerUpdateRequestDto.companyName?.let { partner.companyName = it }
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
