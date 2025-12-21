package org.core.scheduleflow.domain.partner.controller

import org.core.scheduleflow.domain.partner.dto.PartnerContactRequestDto
import org.core.scheduleflow.domain.partner.dto.PartnerContactResponseDto
import org.core.scheduleflow.domain.partner.dto.PartnerRequestDto
import org.core.scheduleflow.domain.partner.dto.PartnerResponseDto

import org.core.scheduleflow.domain.partner.service.PartnerContactService
import org.core.scheduleflow.domain.partner.service.PartnerService
import org.springframework.web.bind.annotation.*


@RestController
@RequestMapping("/partners")
class PartnerController(
    private val partnerService: PartnerService,
    private val partnerContactService: PartnerContactService
) {
    /*==========================================================Partner READ====================================================================*/
    @GetMapping
    fun allPartners() : List<PartnerResponseDto> {
         return partnerService.findAll()
    }

    @GetMapping("/{id}")
    fun findPartnerById(@PathVariable id: Long): PartnerResponseDto? {
        return partnerService.findPartnerById(id)
    }

    @GetMapping("/search")
    fun findPartnerByName(@RequestParam name: String?): List<PartnerResponseDto> {
        return partnerService.findPartnerByNameContains(name)
    }

    /*===========================================================Partner CREATE================================================================*/
    @PostMapping
    fun createPartner(@RequestBody partnerRequestDto : PartnerRequestDto): PartnerResponseDto? {
        return partnerService.createPartner(partnerRequestDto)
    }

    /*===========================================================Partner UPDATE================================================================*/
    @PutMapping
    fun updatePartner(@RequestBody partnerRequestDto : PartnerRequestDto): PartnerResponseDto? {
        return partnerService.updatePartner(partnerRequestDto)
    }

    /*==========================================================Partner DELETE=================================================================*/
    @DeleteMapping("/{id}")
    fun deletePartnerById(@PathVariable id: Long) {
        partnerService.deletePartnerById(id)
    }

    /*======================================================PartnerContact READ=================================================================*/
    @GetMapping("/{partnerId}/contacts")
    fun findPartnerContactByPartnerId(@PathVariable partnerId: Long?): List<PartnerContactResponseDto> {
        return partnerContactService.findPartnerContactByPartnerId(partnerId)
    }

    /*======================================================PartnerContact CREATE=================================================================*/
    @PostMapping("/{partnerId}/contacts")
    fun createPartnerContact(@RequestBody PartnerContactRequestDto: PartnerContactRequestDto, @PathVariable partnerId : Long): PartnerContactResponseDto? {
        return partnerContactService.createPartnerContact(PartnerContactRequestDto, partnerId)
    }

    /*======================================================PartnerContact UPDATE=================================================================*/
    @PutMapping("/{partnerId}/contacts")
    fun updatePartnerContact(@RequestBody PartnerContactRequestDto: PartnerContactRequestDto, @PathVariable partnerId : Long): PartnerContactResponseDto? {
        return partnerContactService.updatePartnerContact(PartnerContactRequestDto, partnerId)
    }

    /*======================================================PartnerContact DELETE=================================================================*/
    @DeleteMapping("/{partnerId}/contacts/{id}")
    fun deletePartnerContactById(@PathVariable partnerId: Long, @PathVariable id: Long) {
        partnerContactService.deletePartnerContactById(partnerId,id)
    }
}
