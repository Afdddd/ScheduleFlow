package org.core.scheduleflow.domain.schedule.repository

import org.core.scheduleflow.domain.project.entity.Project
import org.core.scheduleflow.domain.schedule.entity.Schedule
import org.springframework.data.jpa.repository.JpaRepository

interface ScheduleRepository: JpaRepository<Schedule, Long>, ScheduleRepositoryCustom {
    fun findByProject(project: Project): List<Schedule>
}

interface ScheduleRepositoryCustom {
    fun findByIdWithAll(scheduleId: Long): Schedule?
    fun findAllWithProject(): List<Schedule>
}