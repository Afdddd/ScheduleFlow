package org.core.scheduleflow.domain.partner.controller

import org.core.scheduleflow.domain.partner.dto.PartnerContactRequestDto
import org.core.scheduleflow.domain.partner.dto.PartnerContactResponseDto
import org.core.scheduleflow.domain.partner.dto.PartnerContactUpdateRequestDto
import org.core.scheduleflow.domain.partner.dto.PartnerListResponse
import org.core.scheduleflow.domain.partner.dto.PartnerRequestDto
import org.core.scheduleflow.domain.partner.dto.PartnerResponseDto
import org.core.scheduleflow.domain.partner.dto.PartnerUpdateRequestDto

import org.core.scheduleflow.domain.partner.service.PartnerContactService
import org.core.scheduleflow.domain.partner.service.PartnerService
import org.core.scheduleflow.global.dto.PageResponse
import org.springframework.data.domain.Pageable
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*


@RestController
@RequestMapping("/partners")
class PartnerController(
    private val partnerService: PartnerService,
    private val partnerContactService: PartnerContactService
) {
    /*==========================================================Partner READ====================================================================*/
    @GetMapping
    fun findPartners(
        @RequestParam(required = false) keyword: String?,
        @RequestParam page: Int,
        @RequestParam size: Int,
    ) : PageResponse<PartnerListResponse> {

        val pageable: Pageable = Pageable.ofSize(size).withPage(page)

        val partners = partnerService.findPartners(pageable, keyword)

        return PageResponse.from(partners)

    }

    @GetMapping("/{id}")
    fun findPartnerById(@PathVariable id: Long): PartnerResponseDto? {
        return partnerService.findPartnerById(id)
    }


    /*===========================================================Partner CREATE================================================================*/
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    fun createPartner(@RequestBody partnerRequestDto : PartnerRequestDto): PartnerResponseDto? {
        return partnerService.createPartner(partnerRequestDto)
    }

    /*===========================================================Partner UPDATE================================================================*/
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping
    fun updatePartner(@RequestBody partnerUpdateRequestDto : PartnerUpdateRequestDto): PartnerResponseDto? {
        return partnerService.updatePartner(partnerUpdateRequestDto)
    }

    /*==========================================================Partner DELETE=================================================================*/
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{partnerId}")
    fun deletePartnerById(@PathVariable partnerId: Long) {
        partnerService.deletePartnerById(partnerId)
    }

    /*======================================================PartnerContact READ=================================================================*/
    @GetMapping("/{partnerId}/contacts")
    fun findPartnerContactByPartnerId(@PathVariable partnerId: Long): List<PartnerContactResponseDto> {
        return partnerContactService.findPartnerContactByPartnerId(partnerId)
    }

    /*======================================================PartnerContact CREATE=================================================================*/
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{partnerId}/contacts")
    fun createPartnerContact(@RequestBody partnerContactRequestDto: PartnerContactRequestDto, @PathVariable partnerId : Long): PartnerContactResponseDto? {
        return partnerContactService.createPartnerContact(partnerContactRequestDto, partnerId)
    }

    /*======================================================PartnerContact UPDATE=================================================================*/
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{partnerId}/contacts")
    fun updatePartnerContact(@RequestBody partnerContactUpdateRequestDto: PartnerContactUpdateRequestDto, @PathVariable partnerId : Long): PartnerContactResponseDto? {
        return partnerContactService.updatePartnerContact(partnerContactUpdateRequestDto, partnerId)
    }

    /*======================================================PartnerContact DELETE=================================================================*/
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{partnerId}/contacts/{partnerContactId}")
    fun deletePartnerContactById(@PathVariable partnerId: Long, @PathVariable partnerContactId: Long) {
        partnerContactService.deletePartnerContactById(partnerId,partnerContactId)
    }
}
