package org.core.scheduleflow.domain.partner.service;

import org.core.scheduleflow.domain.partner.dto.PartnerRequestDto;
import org.core.scheduleflow.domain.partner.dto.PartnerResponseDto;
import org.core.scheduleflow.domain.partner.entity.Partner;
import org.core.scheduleflow.domain.partner.repository.PartnerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PartnerService {

    private final PartnerRepository partnerRepository;

    public PartnerService(PartnerRepository partnerRepository) {
        this.partnerRepository = partnerRepository;
    }

    /*==========================================================Partner READ====================================================================*/

    public List<PartnerResponseDto> findAll(){
        List<Partner> partners = partnerRepository.findAll();

        return partners.stream()
                .map(PartnerResponseDto::fromEntity)
                .collect(Collectors.toList());
    }

    public Optional<PartnerResponseDto> selectPartnerById(Long id){
        Optional<Partner> partner = partnerRepository.findById(id);


        return partner.map(PartnerResponseDto::fromEntity);
    }

    public List<PartnerResponseDto> selectPartnerByNameContains(String name){
        List<Partner> partners = partnerRepository.selectPartnerByNameContains(name);

        return partners.stream()
                .map(PartnerResponseDto::fromEntity)
                .collect(Collectors.toList());
    }

    /*===========================================================Partner CREATE================================================================*/

    @Transactional
    public PartnerResponseDto createPartner(PartnerRequestDto requestDto){

        /* 유효성 검증 시작 */
        Objects.requireNonNull(requestDto, "요청 데이터(PartnerRequestDto)는 null일 수 없습니다.");
        if (requestDto.getCompanyName() == null || requestDto.getCompanyName().trim().isEmpty()) {
            throw new IllegalArgumentException("회사 이름은 필수 입력 항목입니다.");
        }
        /* 유효성 검증 끝 */

        Partner partner = requestDto.toEntity();

        Partner savedPartner = partnerRepository.save(partner);

        return PartnerResponseDto.fromEntity(savedPartner);
    }

    /*===========================================================Partner UPDATE================================================================*/
    
    @Transactional
    public PartnerResponseDto updatePartner(PartnerRequestDto requestDto){

        /* 유효성 검증 시작 */
        Objects.requireNonNull(requestDto, "요청 데이터(PartnerRequestDto)는 null일 수 없습니다.");
        if (requestDto.getCompanyName() == null || requestDto.getCompanyName().trim().isEmpty()) {
            throw new IllegalArgumentException("회사 이름은 필수 입력 항목입니다.");
        }
        /* 유효성 검증 끝 */

        Partner partner = requestDto.toEntity();

        Partner savedPartner = partnerRepository.save(partner);

        return PartnerResponseDto.fromEntity(savedPartner);
    }

    /*==========================================================Partner DELETE=================================================================*/

    @Transactional
    public void deletePartnerById(Long id){
        partnerRepository.deleteById(id);
    }

}
