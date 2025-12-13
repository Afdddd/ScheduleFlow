package org.core.scheduleflow

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class ScheduleFlowApplication

fun main(args: Array<String>) {
    runApplication<ScheduleFlowApplication>(*args)
}