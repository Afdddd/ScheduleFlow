package org.core.scheduleflow.domain.schedule.repository

import org.core.scheduleflow.domain.project.entity.Project
import org.core.scheduleflow.domain.schedule.dto.MyTaskResponse
import org.core.scheduleflow.domain.schedule.dto.ScheduleCalenderResponse
import org.core.scheduleflow.domain.schedule.dto.ScheduleListResponse
import org.core.scheduleflow.domain.schedule.entity.Schedule
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
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

    @Query("""
        select new org.core.scheduleflow.domain.schedule.dto.MyTaskResponse(s.id, s.title, p.id, p.name, s.startDate, s.endDate, p.colorCode, s.type)
        from Schedule s
        join s.members m
        join m.user u
        join s.project p
        where u.id = :userId
        and s.startDate <= :endDate and s.endDate >= :startDate
    """
    )
    fun findMyTasksByUserIdAndPeriod(userId: Long, startDate: LocalDate, endDate: LocalDate): List<MyTaskResponse>

    @Query("""
        select new org.core.scheduleflow.domain.schedule.dto.ScheduleListResponse(
            s.id,
            s.title,
            p.name,
            s.type,
            s.startDate,
            s.endDate
        )
         from Schedule s
         left join s.project p
         order by s.startDate
    """)
    fun findScheduleList(pageable: Pageable): Page<ScheduleListResponse>


    @Query("""
        select new org.core.scheduleflow.domain.schedule.dto.ScheduleListResponse(
            s.id,
            s.title,
            p.name,
            s.type,
            s.startDate,
            s.endDate
        )
         from Schedule s
         left join s.project p
         where s.title like %:keyword%
         order by s.startDate
    """)
    fun searchScheduleList(keyword: String, pageable: Pageable): Page<ScheduleListResponse>
}

interface ScheduleRepositoryCustom {
    fun findByIdWithAll(scheduleId: Long): Schedule?
    fun findAllWithProject(): List<Schedule>
}