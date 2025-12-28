package org.core.scheduleflow.domain.project.repository

import org.core.scheduleflow.domain.project.dto.ProjectCalendarResponse
import org.core.scheduleflow.domain.project.entity.Project
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.time.LocalDate

interface ProjectRepository: JpaRepository<Project, Long>, ProjectRepositoryCustom {
    fun existsByName(name: String): Boolean

    @Query("""
        select p
        from Project p 
        left join fetch p.client
        where p.id = :projectId
        """
    )
    fun findByIdWithClient(projectId: Long): Project?

    @Query("""
        select p
        from Project p
        left join fetch p.client
    """)
    fun findAllWithClient(): List<Project>

    @Query("""
        select new org.core.scheduleflow.domain.project.dto.ProjectCalendarResponse(
            p.id, p.name, p.startDate, p.endDate, p.colorCode, p.status
        )
        from Project p
        where p.startDate <= :endDate
        and p.endDate >= :startDate
    """)
    fun findByStartDateBetween(startDate: LocalDate, endDate: LocalDate): List<ProjectCalendarResponse>

    @Query("""
        select distinct p
        from Project p
        left join fetch p.schedules s
        where p.startDate <= :endDate
        and p.endDate >= :startDate
    """)
    fun findByStartDateBetweenWithSchedules(
        startDate: LocalDate,
        endDate: LocalDate
    ): List<Project>
}

interface ProjectRepositoryCustom