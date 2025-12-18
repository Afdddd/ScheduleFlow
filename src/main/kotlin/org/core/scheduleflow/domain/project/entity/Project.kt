package org.core.scheduleflow.domain.project.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.OneToMany
import jakarta.persistence.Table
import org.core.scheduleflow.domain.partner.entity.Partner
import org.core.scheduleflow.domain.project.constant.ProjectStatus
import org.core.scheduleflow.global.entity.BaseEntity
import java.time.LocalDate

@Entity
@Table(name = "projects")
class Project(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    var client: Partner,

    @OneToMany(mappedBy = "project", fetch = FetchType.LAZY)
    var partnerContacts: MutableList<ProjectPartnerContact> = mutableListOf(),

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    var status: ProjectStatus = ProjectStatus.IN_PROGRESS,

    @Column(name = "name", nullable = false)
    var name: String,

    @Column(name = "start_date", nullable = false)
    var startDate: LocalDate,

    @Column(name = "end_date", nullable = false)
    var endDate: LocalDate,

    @Column(name = "description", nullable = true)
    var description: String? = null,

    @Column(name = "color_code", nullable = true)
    var colorCode: String? = null
): BaseEntity() {


}