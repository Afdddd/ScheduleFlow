package org.core.scheduleflow.domain.schedule.repository

import org.core.scheduleflow.domain.schedule.entity.ScheduleMember
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface ScheduleMemberRepository: JpaRepository<ScheduleMember, Long> {
    @Query("SELECT sm FROM ScheduleMember sm JOIN FETCH sm.user WHERE sm.schedule.id IN :scheduleIds")
    fun findByScheduleIdIn(@Param("scheduleIds") scheduleIds: List<Long>): List<ScheduleMember>
}

