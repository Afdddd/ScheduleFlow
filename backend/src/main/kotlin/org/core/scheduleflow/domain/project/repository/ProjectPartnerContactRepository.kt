package org.core.scheduleflow.domain.project.repository

import org.core.scheduleflow.domain.project.entity.ProjectPartnerContact
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query

interface ProjectPartnerContactRepository: JpaRepository<ProjectPartnerContact, Long> {

    @Modifying
    @Query("DELETE FROM ProjectPartnerContact ppc WHERE ppc.partnerContact.id = :partnerContactId")
    fun deleteByPartnerContactId(partnerContactId: Long)
}