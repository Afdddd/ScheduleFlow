package org.core.scheduleflow.domain.partner.dto;

import org.core.scheduleflow.domain.partner.entity.Partner;

public class PartnerRequestDto {

    private String companyName;
    private String mainPhone;
    private String address;
    private String description;

    public PartnerRequestDto() {}

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public String getMainPhone() { return mainPhone; }
    public void setMainPhone(String mainPhone) { this.mainPhone = mainPhone; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }


    public Partner toEntity() {

        return new Partner(
                null, // ID는 DB 자동 할당 (null)
                this.companyName,
                this.mainPhone,
                this.address,
                this.description
        );
    }

}
