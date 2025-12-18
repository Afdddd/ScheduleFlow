package org.core.scheduleflow.domain.partner.repository

import org.core.scheduleflow.domain.partner.entity.PartnerContact
import org.springframework.data.jpa.repository.JpaRepository

interface PartnerContactRepository: JpaRepository<PartnerContact, Long> {
}