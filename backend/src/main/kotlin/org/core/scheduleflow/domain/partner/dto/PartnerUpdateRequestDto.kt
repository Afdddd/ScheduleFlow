package org.core.scheduleflow.domain.partner.dto


data class PartnerUpdateRequestDto(
    val id : Long,
    val companyName: String,
    val mainPhone: String?,
    val address: String?,
    val description: String?
) {



}
