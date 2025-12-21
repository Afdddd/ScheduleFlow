package org.core.scheduleflow.domain.schedule.repository

import org.core.scheduleflow.domain.schedule.entity.ScheduleMember
import org.springframework.data.jpa.repository.JpaRepository

interface ScheduleMemberRepository: JpaRepository<ScheduleMember, Long> {
    fun findByScheduleIdIn(scheduleIds: List<Long>): List<ScheduleMember>
}

