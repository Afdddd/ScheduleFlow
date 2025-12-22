package org.core.scheduleflow.domain.project.repository

import org.core.scheduleflow.domain.project.entity.ProjectPartnerContact
import org.springframework.data.jpa.repository.JpaRepository

interface ProjectPartnerContactRepository: JpaRepository<ProjectPartnerContact, Long> {
}