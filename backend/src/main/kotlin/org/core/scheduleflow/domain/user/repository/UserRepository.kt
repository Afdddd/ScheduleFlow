package org.core.scheduleflow.domain.user.repository

import org.core.scheduleflow.domain.user.dto.TodayTeamTaskResponse
import org.core.scheduleflow.domain.user.entity.User
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.time.LocalDate

interface UserRepository: JpaRepository<User,Long> {
    fun existsByUsername(username: String): Boolean
    fun findByUsername(username: String): User?

    @Query("""
    select new org.core.scheduleflow.domain.user.dto.TodayTeamTaskResponse(
        u.name,
        s.title,
        p.name,
        p.colorCode
    )
    from User u
    left join ScheduleMember sm
           on sm.user = u
    left join sm.schedule s
           on s.startDate <= :date
          and s.endDate   >= :date
    left join s.project p
    order by u.name asc
""")
    fun findTeamTasksByDate(date: LocalDate): List<TodayTeamTaskResponse>
}