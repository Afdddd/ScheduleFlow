package org.core.scheduleflow.domain.partner.dto

import org.core.scheduleflow.domain.partner.entity.Partner
import org.core.scheduleflow.domain.partner.entity.PartnerContact


data class PartnerContactRequestDto(
    var id : Long?,
    var partnerId: Long,
    var name: String,
    var position: String? = null,
    var department: String? = null,
    var phone: String? = null,
    var email: String? = null
) {

    fun toEntity(partner : Partner): PartnerContact {
        return PartnerContact(
            id = this.id,  // 자동 할당
            partner = partner,
            name = this.name,
            position = this.position,
            department = this.department,
            phone = this.phone,
            email = this.email
        )
    }
}
