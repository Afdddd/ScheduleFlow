package org.core.scheduleflow.domain.partner.dto

import org.core.scheduleflow.domain.partner.entity.Partner
import org.core.scheduleflow.domain.partner.entity.PartnerContact

class PartnerContactRequestDto {
    private var partner: Partner? = null
    private var name: String? = null
    var position: String? = null
    var department: String? = null
    var phone: String? = null
    var email: String? = null

    fun getPartner(): Partner {
        return partner!!
    }

    fun setPartner(partner: Partner) {
        this.partner = partner
    }

    fun getName(): String {
        return name!!
    }

    fun setName(name: String) {
        this.name = name
    }

    fun toEntity(): PartnerContact {
        return PartnerContact(
            null,  // 자동 할당
            this.partner!!,
            this.name!!,
            this.position,
            this.department,
            this.phone,
            this.email
        )
    }
}
