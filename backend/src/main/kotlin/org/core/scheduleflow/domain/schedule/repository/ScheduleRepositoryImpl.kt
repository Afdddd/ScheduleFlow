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
    override fun findSchedulesWithMembers(projectId: Long): List<Schedule> {
        val schedule = QSchedule.schedule
        val scheduleMember = QScheduleMember.scheduleMember
        val user = QUser.user

        return queryFactory
            .selectFrom(schedule)
            .leftJoin(schedule.members, scheduleMember).fetchJoin()
            .leftJoin(scheduleMember.user, user).fetchJoin()
            .where(schedule.project.id.eq(projectId))
            .distinct()
            .fetch()
    }
}