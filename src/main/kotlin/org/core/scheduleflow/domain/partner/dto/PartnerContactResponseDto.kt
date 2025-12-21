package org.core.scheduleflow.domain.partner.dto


import org.core.scheduleflow.domain.partner.entity.PartnerContact


data class PartnerContactResponseDto(
    val id: Long?,
    val partnerId: Long?,
    val name: String?,
    val position: String?,
    val department: String?,
    val phone: String?,
    val email: String?
) {
    companion object {
        @JvmStatic
        fun fromEntity(partnerContact: PartnerContact): PartnerContactResponseDto {
            return PartnerContactResponseDto(
                partnerContact.id,
                partnerContact.partner.id,
                partnerContact.name,
                partnerContact.position,
                partnerContact.department,
                partnerContact.phone,
                partnerContact.email
            )
        }
    }
}
