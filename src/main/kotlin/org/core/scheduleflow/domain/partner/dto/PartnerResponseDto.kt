package org.core.scheduleflow.domain.partner.dto

import org.core.scheduleflow.domain.partner.entity.Partner

class PartnerResponseDto(
    val id: Long?,
    val companyName: String?,
    val mainPhone: String?,
    val address: String?,
    val description: String?
) {
    companion object {
        fun fromEntity(partner: Partner): PartnerResponseDto {
            return PartnerResponseDto(
                partner.id,
                partner.companyName,
                partner.mainPhone,
                partner.address,
                partner.description
            )
        }
    }
}
