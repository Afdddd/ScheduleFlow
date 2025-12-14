package org.core.scheduleflow.domain.partner.dto;

import org.core.scheduleflow.domain.partner.entity.Partner;
import org.core.scheduleflow.domain.partner.entity.PartnerContact;

public class PartnerContactRequestDto {

    private Partner partner;
    private String name;
    private String position;
    private String department;
    private String phone;
    private String email;

    public PartnerContactRequestDto() {}

    public Partner getPartner() {
        return partner;
    }
    public void setPartner(Partner partner) {
        this.partner = partner;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPosition() {
        return position;
    }

    public void setPosition(String position) {
        this.position = position;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }
    public String getPhone() {
        return phone;
    }
    public void setPhone(String phone) {
        this.phone = phone;
    }
    public String getEmail() {
        return email;
    }
    public void setEmail(String email) {
        this.email = email;
    }

    public PartnerContact toEntity(){
        return new PartnerContact(
                null, // 자동 할당
                this.partner,
                this.name,
                this.position,
                this.department,
                this.phone,
                this.email
        );
    }

}
