package org.core.scheduleflow.domain.partner.repository

import org.core.scheduleflow.domain.partner.entity.Partner
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface PartnerRepository : JpaRepository<Partner, Long> {
    fun findByCompanyNameContains(companyName: String?): List<Partner>
}
