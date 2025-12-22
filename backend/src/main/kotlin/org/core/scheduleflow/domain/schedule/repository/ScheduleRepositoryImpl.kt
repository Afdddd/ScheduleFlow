package org.core.scheduleflow.domain.schedule.repository

import com.querydsl.jpa.impl.JPAQueryFactory
import org.core.scheduleflow.domain.schedule.entity.QSchedule
import org.core.scheduleflow.domain.schedule.entity.Schedule
import org.springframework.stereotype.Repository

@Repository
class ScheduleRepositoryImpl(
    private val queryFactory: JPAQueryFactory
): ScheduleRepositoryCustom {

    override fun findByIdWithProject(scheduleId: Long): Schedule? {
        val schedule = QSchedule.schedule

        return queryFactory
            .selectFrom(schedule)
            .leftJoin(schedule.project).fetchJoin()
            .where(schedule.id.eq(scheduleId))
            .fetchOne()
    }

    override fun findAllWithProject(): List<Schedule> {
        val schedule = QSchedule.schedule

        return queryFactory
            .selectFrom(schedule)
            .leftJoin(schedule.project).fetchJoin()
            .fetch()
    }
}
