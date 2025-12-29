package org.core.scheduleflow.domain.partner.service

import org.core.scheduleflow.domain.partner.dto.PartnerContactRequestDto
import org.core.scheduleflow.domain.partner.dto.PartnerContactResponseDto
import org.core.scheduleflow.domain.partner.dto.PartnerContactResponseDto.Companion.fromEntity

import org.core.scheduleflow.domain.partner.entity.Partner
import org.core.scheduleflow.domain.partner.entity.PartnerContact
import org.core.scheduleflow.domain.partner.repository.PartnerContactRepository
import org.core.scheduleflow.domain.partner.repository.PartnerRepository
import org.core.scheduleflow.global.exception.CustomException
import org.core.scheduleflow.global.exception.ErrorCode
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional


@Service
@Transactional
class PartnerContactService (
    private val partnerContactRepository: PartnerContactRepository,
    private val partnerRepository: PartnerRepository
){


    fun findPartnerContactByPartnerId(partnerId: Long?): List<PartnerContactResponseDto> {

        if (partnerId == null) return emptyList()


        val partnerContacts = partnerContactRepository.findByPartnerId(partnerId) ?: emptyList()


        return partnerContacts.mapNotNull { contact ->
            PartnerContactResponseDto.fromEntity(contact)
        }
    }

    fun createPartnerContact(partnerContactRequestDto: PartnerContactRequestDto, partnerId : Long): PartnerContactResponseDto {
        /* 유효성 검증 시작 */

        val partner: Partner = partnerRepository.findByIdOrNull(partnerId) ?:throw CustomException(ErrorCode.NOT_FOUND_PARTNER)

        /* 유효성 검증 끝 */


        val partnerContact = partnerContactRequestDto.toEntity(partner)

        val savedPartnerContact = partnerContactRepository.save<PartnerContact>(partnerContact)

        return fromEntity(savedPartnerContact)
    }

    fun updatePartnerContact(partnerContactRequestDto: PartnerContactRequestDto, partnerId : Long): PartnerContactResponseDto {
        /* 유효성 검증 시작 */
        val contactId = partnerContactRequestDto.id ?: throw IllegalArgumentException("수정 시 ID는 필수입니다.")

        partnerContactRepository.findByIdOrNull(contactId) ?: throw CustomException(ErrorCode.NOT_FOUND_PARTNER_CONTACT)

        val partner = partnerRepository.findByIdOrNull(partnerId) ?:throw CustomException(ErrorCode.NOT_FOUND_PARTNER)

        /* 유효성 검증 끝 */


        val partnerContact = partnerContactRequestDto.toEntity(partner)


        val savedPartnerContact = partnerContactRepository.save(partnerContact)

        return fromEntity(savedPartnerContact)
    }

    fun deletePartnerContactById(partnerId : Long, id: Long) {

        partnerRepository.findByIdOrNull(partnerId) ?: throw CustomException(ErrorCode.NOT_FOUND_PARTNER)

        val contact = partnerContactRepository.findByIdOrNull(id) ?: throw CustomException(ErrorCode.NOT_FOUND_PARTNER_CONTACT)

        if (contact.partner.id != partnerId) {
            throw IllegalArgumentException("해당 고객사에 소속된 직원이 아닙니다.")
        }


        partnerContactRepository.deleteById(id)
    }
}
