package org.core.scheduleflow.domain.schedule.repository

import com.querydsl.jpa.impl.JPAQueryFactory
import org.core.scheduleflow.domain.schedule.entity.QSchedule
import org.core.scheduleflow.domain.schedule.entity.QScheduleMember
import org.core.scheduleflow.domain.schedule.entity.Schedule
import org.core.scheduleflow.domain.user.entity.QUser
import org.springframework.stereotype.Repository

@Repository
class ScheduleRepositoryImpl(
    private val queryFactory: JPAQueryFactory
): ScheduleRepositoryCustom {

    override fun findByIdWithAll(scheduleId: Long): Schedule? {
        val schedule = QSchedule.schedule
        val member = QScheduleMember.scheduleMember
        val user = QUser.user

        return queryFactory
            .selectFrom(schedule)
            .leftJoin(schedule.project).fetchJoin()
            .leftJoin(schedule.members, member).fetchJoin()
            .leftJoin(member.user, user).fetchJoin()
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
