package org.core.scheduleflow.domain.partner.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import org.core.scheduleflow.global.entity.BaseEntity

@Entity
@Table(name = "partner_contacts")
class PartnerContact(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "partner_id")
    var partner: Partner,

    @Column(name = "name", nullable = false)
    var name: String,

    @Column(name = "position", nullable = true)
    var position: String? = null,

    @Column(name = "department", nullable = true)
    var department: String? = null,

    @Column(name = "phone", nullable = true)
    var phone: String? = null,

    @Column(name = "email", nullable = true)
    var email: String? = null,
): BaseEntity()