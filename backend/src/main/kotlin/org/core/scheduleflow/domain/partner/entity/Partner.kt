package org.core.scheduleflow.domain.partner.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.core.scheduleflow.global.entity.BaseEntity

@Entity
@Table(name = "partners")
class Partner(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(name = "company_name", nullable = false)
    var companyName: String,

    @Column(name = "main_phone", nullable = true)
    var mainPhone: String? = null,

    @Column(name = "address", nullable = true)
    var address: String? = null,

    @Column(name = "description", nullable = true)
    var description: String? = null,
): BaseEntity()