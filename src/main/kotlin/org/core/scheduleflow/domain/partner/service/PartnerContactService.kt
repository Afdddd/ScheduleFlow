package org.core.scheduleflow.domain.partner.service

import org.core.scheduleflow.domain.partner.dto.PartnerContactRequestDto
import org.core.scheduleflow.domain.partner.dto.PartnerContactResponseDto
import org.core.scheduleflow.domain.partner.dto.PartnerContactResponseDto.Companion.fromEntity

import org.core.scheduleflow.domain.partner.entity.Partner
import org.core.scheduleflow.domain.partner.entity.PartnerContact
import org.core.scheduleflow.domain.partner.repository.PartnerContactRepository
import org.core.scheduleflow.domain.partner.repository.PartnerRepository
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

        val partner: Partner = partnerRepository.findById(partnerId).orElseThrow() { IllegalArgumentException("존재하지 않는 고객사 ID입니다: $partnerId") }

        /* 유효성 검증 끝 */


        val partnerContact = partnerContactRequestDto.toEntity(partner)

        val savedPartnerContact = partnerContactRepository.save<PartnerContact>(partnerContact)

        return fromEntity(savedPartnerContact)
    }

    fun updatePartnerContact(partnerContactRequestDto: PartnerContactRequestDto, partnerId : Long): PartnerContactResponseDto {
        /* 유효성 검증 시작 */
        val contactId = partnerContactRequestDto.id ?: throw IllegalArgumentException("수정 시 ID는 필수입니다.")

        partnerContactRepository.findById(contactId).orElseThrow() {IllegalArgumentException("수정할 직원이 존재하지 않습니다.")}

        val partner: Partner = partnerRepository.findById(partnerId).orElseThrow() { IllegalArgumentException("존재하지 않는 고객사 ID입니다: $partnerId") }

        /* 유효성 검증 끝 */


        val partnerContact = partnerContactRequestDto.toEntity(partner)


        val savedPartnerContact = partnerContactRepository.save(partnerContact)

        return fromEntity(savedPartnerContact)
    }

    fun deletePartnerContactById(partnerId : Long, id: Long) {

        partnerRepository.findById(partnerId).orElseThrow() { IllegalArgumentException("존재하지 않는 고객사 ID입니다: $partnerId") }

        partnerContactRepository.findById(id).orElseThrow() {IllegalArgumentException("수정할 직원이 존재하지 않습니다.")}


        partnerContactRepository.deleteById(id)
    }
}
