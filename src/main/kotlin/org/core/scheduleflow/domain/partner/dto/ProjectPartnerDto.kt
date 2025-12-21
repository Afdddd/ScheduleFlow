package org.core.scheduleflow.domain.partner.dto

import org.core.scheduleflow.domain.partner.entity.Partner

data class ProjectPartnerDto(
    val memberId: Long,
    val companyName: String,
    val mainPhone: String,
    val address: String,
) {
    companion object {
        fun from(partner: Partner): ProjectPartnerDto {
            return ProjectPartnerDto(
                memberId = partner.id!!,
                companyName = partner.companyName,
                mainPhone = partner.mainPhone ?: "",
                address = partner.address ?: ""
            )
        }
    }
}
