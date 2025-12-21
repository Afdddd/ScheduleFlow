package org.core.scheduleflow.domain.partner.repository

import org.core.scheduleflow.domain.partner.entity.PartnerContact
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface PartnerContactRepository : JpaRepository<PartnerContact, Long> {
    fun findByPartnerId(partnerId: Long?): List<PartnerContact>

}
