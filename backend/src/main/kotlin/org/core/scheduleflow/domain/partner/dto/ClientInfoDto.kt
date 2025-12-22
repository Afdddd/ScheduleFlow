package org.core.scheduleflow.domain.partner.dto

import org.core.scheduleflow.domain.partner.entity.Partner

data class ClientInfoDto(
    val id: Long,
    val companyName: String
) {
    companion object {
        fun from(partner: Partner): ClientInfoDto {
            return ClientInfoDto(
                id = partner.id!!,
                companyName = partner.companyName
            )
        }
    }
}
