package org.core.scheduleflow.domain.partner.repository

import org.core.scheduleflow.domain.partner.entity.PartnerContact
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

interface PartnerContactRepository : JpaRepository<PartnerContact, Long> {
    
    @Query("SELECT ppc FROM PartnerContact ppc WHERE ppc.partner.id = :partnerId")
    fun findByPartnerId(partnerId: Long?): List<PartnerContact>
}

