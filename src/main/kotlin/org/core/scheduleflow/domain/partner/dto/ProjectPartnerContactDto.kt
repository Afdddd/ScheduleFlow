package org.core.scheduleflow.domain.partner.dto

import org.core.scheduleflow.domain.project.entity.ProjectPartnerContact

data class ProjectPartnerContactDto(
    val partnerContactId: Long,
    val name: String,
    val companyName: String,
    val position: String?,
    val phone: String?,
    val email: String?,
) {
    companion object {
        fun from(projectPartnerContact: ProjectPartnerContact): ProjectPartnerContactDto {
            return ProjectPartnerContactDto(
                partnerContactId = projectPartnerContact.partnerContact.id!!,
                name = projectPartnerContact.partnerContact.name,
                companyName = projectPartnerContact.partnerContact.partner.companyName,
                position = projectPartnerContact.partnerContact.position,
                phone = projectPartnerContact.partnerContact.phone,
                email = projectPartnerContact.partnerContact.email
            )
        }
    }
}
