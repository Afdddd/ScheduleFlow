package org.core.scheduleflow.domain.partner.controller;

import org.core.scheduleflow.domain.partner.dto.PartnerContactRequestDto;
import org.core.scheduleflow.domain.partner.dto.PartnerContactResponseDto;
import org.core.scheduleflow.domain.partner.dto.PartnerRequestDto;
import org.core.scheduleflow.domain.partner.dto.PartnerResponseDto;
import org.core.scheduleflow.domain.partner.entity.Partner;
import org.core.scheduleflow.domain.partner.entity.PartnerContact;
import org.core.scheduleflow.domain.partner.service.PartnerContactService;
import org.core.scheduleflow.domain.partner.service.PartnerService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/partners")
public class PartnerController {

    private final PartnerService partnerService;
    private final PartnerContactService partnerContactService;

    public PartnerController(PartnerService partnerService, PartnerContactService partnerContactService) {
        this.partnerService = partnerService;
        this.partnerContactService = partnerContactService;
    }




    /*==========================================================Partner READ====================================================================*/

    @GetMapping
    public List<PartnerResponseDto> getAllPartners(){
        return  partnerService.findAll();
    }

    @GetMapping("/{id}")
    public Optional<PartnerResponseDto> selectPartnerById(@PathVariable Long id){
        return partnerService.selectPartnerById(id);
    }

    @GetMapping("/{name}")
    public List<PartnerResponseDto> selectPartnerByName(@PathVariable String name){
        return partnerService.selectPartnerByNameContains(name);
    }

    /*===========================================================Partner CREATE================================================================*/

    @PostMapping
    public PartnerResponseDto createPartner(@RequestBody PartnerRequestDto requestDto){
        return partnerService.createPartner(requestDto);
    }

    /*===========================================================Partner UPDATE================================================================*/

    @PutMapping
    public PartnerResponseDto updatePartner(@RequestBody PartnerRequestDto requestDto){
        return partnerService.updatePartner(requestDto);
    }

    /*==========================================================Partner DELETE=================================================================*/

    @DeleteMapping
    public void deletePartnerById(@PathVariable Long Id){
        partnerService.deletePartnerById(Id);
    }

    /*======================================================PartnerContact READ=================================================================*/

    @GetMapping("/{partnerId}/contacts")
    public List<PartnerContactResponseDto> selectPartnerContactByPartnerId(@PathVariable Long partnerId){
        return partnerContactService.selectPartnerContactByPartnerId(partnerId);
    }

    /*======================================================PartnerContact CREATE=================================================================*/

    @PostMapping("/{partnerId}/contacts")
    public PartnerContactResponseDto createPartnerContact(@RequestBody PartnerContactRequestDto requestDto){
        return partnerContactService.createPartnerContact(requestDto);
    }

    /*======================================================PartnerContact UPDATE=================================================================*/

    @PutMapping("/{partnerId}/contacts")
    public PartnerContactResponseDto updatePartnerContact(@RequestBody PartnerContactRequestDto requestDto){
        return partnerContactService.updatePartnerContact(requestDto);
    }

    /*======================================================PartnerContact DELETE=================================================================*/

    @DeleteMapping("/{partnerId}/contacts")
    public void deletePartnerContactById(@RequestBody PartnerContact partnerContact){
        partnerContactService.deletePartnerContactById(partnerContact.getId());
    }

}
