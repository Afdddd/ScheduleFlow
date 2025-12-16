package org.core.scheduleflow.domain.partner.service;

import org.core.scheduleflow.domain.partner.dto.PartnerContactRequestDto;
import org.core.scheduleflow.domain.partner.dto.PartnerContactResponseDto;
import org.core.scheduleflow.domain.partner.dto.PartnerResponseDto;
import org.core.scheduleflow.domain.partner.entity.PartnerContact;
import org.core.scheduleflow.domain.partner.repository.PartnerContactRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class PartnerContactService {

    private PartnerContactRepository partnerContactRepository;

    public PartnerContactRepository getPartnerContactRepository() {
        return partnerContactRepository;
    }

    public List<PartnerContactResponseDto> selectPartnerContactByPartnerId(Long partnerId) {
        List<PartnerContact> partnerContacts = partnerContactRepository.findByPartnerId(partnerId);

        return partnerContacts.stream().map(PartnerContactResponseDto::fromEntity).collect(Collectors.toList());
    }

    public PartnerContactResponseDto createPartnerContact(PartnerContactRequestDto requestDto){

        /* 유효성 검증 시작 */
        Objects.requireNonNull(requestDto, "요청 데이터(PartnerRequestDto)는 null일 수 없습니다.");
        if (requestDto.getName() == null || requestDto.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("이름은 필수 입력 항목입니다.");
        }
        /* 유효성 검증 끝 */

        PartnerContact partnerContact = requestDto.toEntity();

        PartnerContact savedPartnerContact = partnerContactRepository.save(partnerContact);

        return PartnerContactResponseDto.fromEntity(savedPartnerContact);
    }

    public PartnerContactResponseDto updatePartnerContact(PartnerContactRequestDto requestDto){
        /* 유효성 검증 시작 */
        Objects.requireNonNull(requestDto, "요청 데이터(PartnerRequestDto)는 null일 수 없습니다.");
        if (requestDto.getName() == null || requestDto.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("이름은 필수 입력 항목입니다.");
        }
        /* 유효성 검증 끝 */

        PartnerContact partnerContact = requestDto.toEntity();

        PartnerContact savedPartnerContact = partnerContactRepository.save(partnerContact);

        return PartnerContactResponseDto.fromEntity(savedPartnerContact);
    }

    public void deletePartnerContactById(Long id){
        partnerContactRepository.deleteById(id);
    }
}
