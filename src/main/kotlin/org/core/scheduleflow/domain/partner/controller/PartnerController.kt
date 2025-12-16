package org.core.scheduleflow.domain.partner.controller

import org.core.scheduleflow.domain.partner.dto.PartnerContactRequestDto
import org.core.scheduleflow.domain.partner.dto.PartnerContactResponseDto
import org.core.scheduleflow.domain.partner.dto.PartnerRequestDto
import org.core.scheduleflow.domain.partner.dto.PartnerResponseDto
import org.core.scheduleflow.domain.partner.entity.PartnerContact
import org.core.scheduleflow.domain.partner.service.PartnerContactService
import org.core.scheduleflow.domain.partner.service.PartnerService
import org.springframework.web.bind.annotation.*
import java.util.*

@RestController
@RequestMapping("/partners")
class PartnerController(
    private val partnerService: PartnerService,
    private val partnerContactService: PartnerContactService
) {
    /*==========================================================Partner READ====================================================================*/
    @get:GetMapping
    val allPartners: List<PartnerResponseDto>
         get() = partnerService.findAll()

    @GetMapping("/{id}")
    fun findPartnerById(@PathVariable id: Long?): PartnerResponseDto? {
        return partnerService.findPartnerById(id)
    }

    @GetMapping("/{name}")
    fun findPartnerByName(@PathVariable name: String?): List<PartnerResponseDto> {
        return partnerService.findPartnerByNameContains(name)
    }

    /*===========================================================Partner CREATE================================================================*/
    @PostMapping
    fun createPartner(@RequestBody requestDto: PartnerRequestDto?): PartnerResponseDto? {
        return partnerService.createPartner(requestDto)
    }

    /*===========================================================Partner UPDATE================================================================*/
    @PutMapping
    fun updatePartner(@RequestBody requestDto: PartnerRequestDto?): PartnerResponseDto? {
        return partnerService.updatePartner(requestDto)
    }

    /*==========================================================Partner DELETE=================================================================*/
    @DeleteMapping
    fun deletePartnerById(@PathVariable Id: Long) {
        partnerService.deletePartnerById(Id)
    }

    /*======================================================PartnerContact READ=================================================================*/
    @GetMapping("/{partnerId}/contacts")
    fun findPartnerContactByPartnerId(@PathVariable partnerId: Long?): List<PartnerContactResponseDto> {
        return partnerContactService.findPartnerContactByPartnerId(partnerId)
    }

    /*======================================================PartnerContact CREATE=================================================================*/
    @PostMapping("/{partnerId}/contacts")
    fun createPartnerContact(@RequestBody requestDto: PartnerContactRequestDto?): PartnerContactResponseDto? {
        return partnerContactService.createPartnerContact(requestDto)
    }

    /*======================================================PartnerContact UPDATE=================================================================*/
    @PutMapping("/{partnerId}/contacts")
    fun updatePartnerContact(@RequestBody requestDto: PartnerContactRequestDto?): PartnerContactResponseDto? {
        return partnerContactService.updatePartnerContact(requestDto)
    }

    /*======================================================PartnerContact DELETE=================================================================*/
    @DeleteMapping("/{partnerId}/contacts")
    fun deletePartnerContactById(@RequestBody partnerContact: PartnerContact) {
        partnerContact.id?.let { partnerContactService.deletePartnerContactById(it) }
    }
}
