package org.core.scheduleflow.domain.partner.dto;

import org.core.scheduleflow.domain.partner.entity.Partner;
import org.core.scheduleflow.domain.partner.entity.PartnerContact;

public class PartnerResponseDto {
    private final Long id;
    private final String companyName;
    private final String mainPhone;
    private final String address;
    private final String description;


    public PartnerResponseDto(Long id, String companyName, String mainPhone, String address, String description) {
        this.id = id;
        this.companyName = companyName;
        this.mainPhone = mainPhone;
        this.address = address;
        this.description = description;
    }

    public static PartnerResponseDto fromEntity(Partner partner) {
        return new PartnerResponseDto(
                partner.getId(),
                partner.getCompanyName(),
                partner.getMainPhone(),
                partner.getAddress(),
                partner.getDescription()
        );
    }

    public Long getId() {
        return id;
    }

    public String getCompanyName() {
        return companyName;
    }

    public String getMainPhone() {
        return mainPhone;
    }

    public String getAddress() {
        return address;
    }

    public String getDescription() {
        return description;
    }


}
