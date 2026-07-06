package org.core.scheduleflow

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.data.jpa.repository.config.EnableJpaAuditing

@EnableJpaAuditing
@SpringBootApplication
class ScheduleFlowApplication

fun main(args: Array<String>) {
    runApplication<ScheduleFlowApplication>(*args)
}