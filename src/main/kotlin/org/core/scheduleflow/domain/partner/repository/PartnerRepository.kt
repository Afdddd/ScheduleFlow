package org.core.scheduleflow.domain.partner.repository

import org.core.scheduleflow.domain.partner.entity.Partner
import org.springframework.data.jpa.repository.JpaRepository

interface PartnerRepository: JpaRepository<Partner, Long> {
}