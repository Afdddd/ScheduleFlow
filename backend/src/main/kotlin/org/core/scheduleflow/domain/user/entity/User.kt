package org.core.scheduleflow.domain.user.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.core.scheduleflow.domain.user.constant.Role
import org.core.scheduleflow.global.entity.BaseEntity

@Entity
@Table(name = "users")
class User(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "user_role", nullable = false)
    var userRole: Role = Role.STAFF,

    @Column(name = "username", nullable = false, unique = true)
    var username: String,

    @Column(name = "password", nullable = false)
    var password: String,

    @Column(name = "name", nullable = false, unique = true)
    var name: String,

    @Column(name = "email", nullable = true)
    var email: String? = null,

    @Column(name = "phone", nullable = false)
    var phone: String,

    @Column(name = "position", nullable = true)
    var position: String? = null,
): BaseEntity() {

    fun updateRole(role: Role) {
        this.userRole = role
    }
}