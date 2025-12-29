package org.core.scheduleflow.domain.partner.dto


data class PartnerUpdateRequestDto(
    val id : Long,
    var companyName: String,
    var mainPhone: String?,
    var address: String?,
    var description: String?
) {



}
