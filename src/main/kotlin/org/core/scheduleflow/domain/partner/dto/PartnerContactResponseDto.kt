package org.core.scheduleflow.domain.partner.dto;

import org.core.scheduleflow.domain.partner.entity.Partner;
import org.core.scheduleflow.domain.partner.entity.PartnerContact;

public class PartnerContactResponseDto {
    private final Long id;
    private final Partner partner;
    private final String name;
    private final String position;
    private final String department;
    private final String phone;
    private final String email;

    public PartnerContactResponseDto(Long id, Partner partner, String name, String position, String department, String phone, String email) {
        this.id = id;
        this.partner = partner;
        this.name = name;
        this.position = position;
        this.department = department;
        this.phone = phone;
        this.email = email;
    }



    public static PartnerContactResponseDto fromEntity(PartnerContact partnerContact) {
        return new PartnerContactResponseDto(
                partnerContact.getId(),
                partnerContact.getPartner(),
                partnerContact.getName(),
                partnerContact.getPosition(),
                partnerContact.getDepartment(),
                partnerContact.getPhone(),
                partnerContact.getEmail()
        );
    }

    public Long getId() {
        return id;
    }

    public Partner getPartner() {
        return partner;
    }

    public String getName() {
        return name;
    }

    public String getPosition() {
        return position;
    }

    public String getDepartment() {
        return department;
    }

    public String getPhone() {
        return phone;
    }

    public String getEmail() {
        return email;
    }
}
