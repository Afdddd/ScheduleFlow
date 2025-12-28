package org.core.scheduleflow.domain.schedule.repository

import org.core.scheduleflow.domain.project.entity.Project
import org.core.scheduleflow.domain.schedule.dto.ScheduleCalenderResponse
import org.core.scheduleflow.domain.schedule.entity.Schedule
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.time.LocalDate

interface ScheduleRepository: JpaRepository<Schedule, Long>, ScheduleRepositoryCustom {
    fun findByProject(project: Project): List<Schedule>

    @Query("""
        select new org.core.scheduleflow.domain.schedule.dto.ScheduleCalenderResponse(s.id, s.title, s.startDate, s.endDate, s.type) 
        from Schedule s 
        where s.startDate <= :endDate
        and s.endDate >= :startDate 
        and s.project is null
    """)
    fun findByStartDateBetween(startDate: LocalDate, endDate: LocalDate): List<ScheduleCalenderResponse>
}

interface ScheduleRepositoryCustom {
    fun findByIdWithAll(scheduleId: Long): Schedule?
    fun findAllWithProject(): List<Schedule>
}