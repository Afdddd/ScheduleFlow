package org.core.scheduleflow.domain.schedule.entity

import jakarta.persistence.*
import org.core.scheduleflow.domain.project.entity.Project
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
    var endDate : LocalDate,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    var project: Project? = null,

    @OneToMany(mappedBy = "schedule", fetch = FetchType.LAZY, cascade = [CascadeType.ALL], orphanRemoval = true)
    val members: MutableList<ScheduleMember> = mutableListOf()

): BaseEntity() {
    fun updateProject(project: Project) {
        this.project = project
    }

    fun updateScheduleMembers(scheduleMembers: List<ScheduleMember>) {
        members.clear()
        scheduleMembers.forEach { member
            -> members.add(member)
        }
    }
}