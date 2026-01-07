package org.core.scheduleflow.domain.partner.repository

import org.core.scheduleflow.domain.partner.dto.PartnerListResponse
import org.core.scheduleflow.domain.partner.entity.Partner
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

interface PartnerRepository : JpaRepository<Partner, Long> {

    @Query("SELECT new org.core.scheduleflow.domain.partner.dto.PartnerListResponse(p.id, p.companyName, p.mainPhone, p.address) FROM Partner p")
    fun findPartners(pageable: Pageable): Page<PartnerListResponse>

    @Query("SELECT new org.core.scheduleflow.domain.partner.dto.PartnerListResponse(p.id, p.companyName, p.mainPhone, p.address) FROM Partner p WHERE p.companyName LIKE CONCAT('%', :keyword, '%')")
    fun findByCompanyNameContains(pageable: Pageable, keyword: String?): Page<PartnerListResponse>
}
