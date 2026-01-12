package org.core.scheduleflow.domain.schedule.dto

import org.core.scheduleflow.domain.schedule.entity.ScheduleMember

data class ScheduleMemberDto(
    val id: Long,
    val name: String,
    val position: String,
) {
    companion object {
        fun from(scheduleMember: ScheduleMember): ScheduleMemberDto {
            return ScheduleMemberDto(
                id = scheduleMember.user.id!!,
                name = scheduleMember.user.name,
                position = scheduleMember.user.position ?: ""
            )
        }
    }
}
