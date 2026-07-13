package org.core.scheduleflow

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

// JPA Auditing 활성화는 JpaAuditingConfig에서 담당 (AuditorAware 빈과 함께)
@SpringBootApplication
class ScheduleFlowApplication

fun main(args: Array<String>) {
    runApplication<ScheduleFlowApplication>(*args)
}