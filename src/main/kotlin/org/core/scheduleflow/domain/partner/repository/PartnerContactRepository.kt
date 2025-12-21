package org.core.scheduleflow.domain.partner.repository

import org.core.scheduleflow.domain.partner.entity.PartnerContact
import org.springframework.data.jpa.repository.JpaRepositor

@Repository
interface PartnerContactRepository : JpaRepository<PartnerContact, Long> {
    fun findByPartnerId(partnerId: Long?): List<PartnerContact>
}

