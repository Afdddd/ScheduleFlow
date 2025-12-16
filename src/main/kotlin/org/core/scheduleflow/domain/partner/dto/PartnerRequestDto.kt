package org.core.scheduleflow.domain.partner.dto

import org.core.scheduleflow.domain.partner.entity.Partner

class PartnerRequestDto {
    private var companyName: String? = null
    var mainPhone: String? = null
    var address: String? = null
    var description: String? = null

    fun getCompanyName(): String {
        return companyName!!
    }

    fun setCompanyName(companyName: String) {
        this.companyName = companyName
    }


    fun toEntity(): Partner {
        return Partner(
            null,  // ID는 DB 자동 할당 (null)
            this.companyName!!,
            this.mainPhone,
            this.address,
            this.description
        )
    }
}
