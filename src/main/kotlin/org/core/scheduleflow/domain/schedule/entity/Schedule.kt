package org.core.scheduleflow.domain.schedule.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.core.scheduleflow.domain.schedule.constant.ScheduleType
import org.core.scheduleflow.global.entity.BaseEntity
import java.time.LocalDate

@Entity
@Table(name = "schedules")
class Schedule(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "type")
    var type: ScheduleType = ScheduleType.PROJECT,

    @Column(name = "title", nullable = false)
    var title : String,

    @Column(name = "start_date", nullable = false)
    var startDate : LocalDate,

    @Column(name = "end_date", nullable = false)
    var endDate : LocalDate
): BaseEntity()