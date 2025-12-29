package org.core.scheduleflow.domain.partner.dto

import org.core.scheduleflow.domain.partner.entity.Partner
import org.core.scheduleflow.domain.partner.entity.PartnerContact


data class PartnerContactUpdateRequestDto(
    var id : Long?,
    var name: String?,
    var position: String?,
    var department: String?,
    var phone: String?,
    var email: String?
)