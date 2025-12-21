package org.core.scheduleflow.domain.partner.dto

import org.core.scheduleflow.domain.partner.entity.Partner

data class PartnerRequestDto(
    val id : Long?,
    var companyName: String,
    var mainPhone: String?,
    var address: String?,
    var description: String?
) {


    fun toEntity(): Partner {
        return Partner(
            id = this.id,  // ID는 DB 자동 할당 (null)
            companyName = this.companyName,
            mainPhone = this.mainPhone,
            address = this.address,
            description = this.description
        )
    }
}
