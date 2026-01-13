package org.core.scheduleflow.domain.partner.service

import org.core.scheduleflow.domain.partner.dto.PartnerContactRequestDto
import org.core.scheduleflow.domain.partner.dto.PartnerContactResponseDto
import org.core.scheduleflow.domain.partner.dto.PartnerContactResponseDto.Companion.fromEntity
import org.core.scheduleflow.domain.partner.dto.PartnerContactUpdateRequestDto

import org.core.scheduleflow.domain.partner.entity.Partner
import org.core.scheduleflow.domain.partner.entity.PartnerContact
import org.core.scheduleflow.domain.partner.repository.PartnerContactRepository
import org.core.scheduleflow.domain.partner.repository.PartnerRepository
import org.core.scheduleflow.domain.project.repository.ProjectPartnerContactRepository
import org.core.scheduleflow.global.exception.CustomException
import org.core.scheduleflow.global.exception.ErrorCode
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional


@Service
@Transactional
class PartnerContactService (
    private val partnerContactRepository: PartnerContactRepository,
    private val partnerRepository: PartnerRepository,
    private val projectPartnerContactRepository: ProjectPartnerContactRepository
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

    fun updatePartnerContact(partnerContactUpdateRequestDto: PartnerContactUpdateRequestDto, partnerId : Long): PartnerContactResponseDto {
        /* 유효성 검증 시작 */
        val contactId = partnerContactUpdateRequestDto.id ?: throw IllegalArgumentException("수정 시 ID는 필수입니다.")

        val partnerContact =  partnerContactRepository.findByIdOrNull(contactId) ?: throw CustomException(ErrorCode.NOT_FOUND_PARTNER_CONTACT)

        partnerRepository.findByIdOrNull(partnerId) ?:throw CustomException(ErrorCode.NOT_FOUND_PARTNER)

        /* 유효성 검증 끝 */

        partnerContactUpdateRequestDto.name?.let {partnerContact.name = it }
        partnerContactUpdateRequestDto.position?.let {partnerContact.position = it }
        partnerContactUpdateRequestDto.department?.let {partnerContact.department = it }
        partnerContactUpdateRequestDto.phone?.let {partnerContact.phone = it }
        partnerContactUpdateRequestDto.email?.let {partnerContact.email = it }

        val savedPartnerContact = partnerContactRepository.save(partnerContact)

        return fromEntity(savedPartnerContact)
    }

    @Transactional
    fun deletePartnerContactById(partnerId : Long, partnerContactId: Long) {

        partnerRepository.findByIdOrNull(partnerId) ?: throw CustomException(ErrorCode.NOT_FOUND_PARTNER)

        val contact = partnerContactRepository.findByIdOrNull(partnerContactId) ?: throw CustomException(ErrorCode.NOT_FOUND_PARTNER_CONTACT)

        if (contact.partner.id != partnerId) {
            throw CustomException(ErrorCode.PARTNER_CONTACT_MISMATCH)
        }

        projectPartnerContactRepository.deleteByPartnerContactId(partnerContactId)

        partnerContactRepository.deleteById(partnerContactId)
    }
}
