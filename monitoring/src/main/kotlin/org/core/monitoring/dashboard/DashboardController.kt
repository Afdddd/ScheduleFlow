package org.core.monitoring.dashboard

import org.core.monitoring.alert.AlertService
import org.core.monitoring.domain.*
import org.core.monitoring.scheduler.HealthCheckScheduler
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/admin/monitoring")
class DashboardController(
    private val healthCheckScheduler: HealthCheckScheduler,
    private val alertService: AlertService
) {

    /**
     * Get overall system health status
     */
    @GetMapping("/health")
    fun getHealth(): ResponseEntity<SystemHealth> {
        return ResponseEntity.ok(healthCheckScheduler.getCurrentHealth())
    }

    /**
     * Get current system metrics
     */
    @GetMapping("/system")
    fun getSystemMetrics(): ResponseEntity<Any> {
        val health = healthCheckScheduler.getCurrentHealth()
        return health.system?.let { ResponseEntity.ok(it as Any) }
            ?: ResponseEntity.notFound().build()
    }

    /**
     * Get system metrics history
     */
    @GetMapping("/system/history")
    fun getSystemMetricsHistory(): ResponseEntity<List<SystemMetrics>> {
        return ResponseEntity.ok(healthCheckScheduler.getSystemMetricsHistory())
    }

    /**
     * Get Docker status
     */
    @GetMapping("/docker")
    fun getDockerStatus(): ResponseEntity<Any> {
        val health = healthCheckScheduler.getCurrentHealth()
        return health.docker?.let { ResponseEntity.ok(it as Any) }
            ?: ResponseEntity.notFound().build()
    }

    /**
     * Get Docker status history
     */
    @GetMapping("/docker/history")
    fun getDockerStatusHistory(): ResponseEntity<List<DockerStatus>> {
        return ResponseEntity.ok(healthCheckScheduler.getDockerStatusHistory())
    }

    /**
     * Get GitHub Runner status
     */
    @GetMapping("/runners")
    fun getRunnerStatus(): ResponseEntity<List<GitHubRunnerStatus>> {
        val health = healthCheckScheduler.getCurrentHealth()
        return ResponseEntity.ok(health.runners)
    }

    /**
     * Get all alerts
     */
    @GetMapping("/alerts")
    fun getAlerts(
        @RequestParam(defaultValue = "50") limit: Int
    ): ResponseEntity<List<Alert>> {
        return ResponseEntity.ok(alertService.getRecentAlerts(limit))
    }

    /**
     * Acknowledge an alert
     */
    @PostMapping("/alerts/{alertId}/acknowledge")
    fun acknowledgeAlert(@PathVariable alertId: String): ResponseEntity<Map<String, Any>> {
        val success = alertService.acknowledgeAlert(alertId)
        return if (success) {
            ResponseEntity.ok(mapOf("success" to true, "message" to "Alert acknowledged"))
        } else {
            ResponseEntity.badRequest().body(mapOf("success" to false, "message" to "Alert not found"))
        }
    }

    /**
     * Dashboard summary for quick overview
     */
    @GetMapping("/summary")
    fun getSummary(): ResponseEntity<DashboardSummary> {
        val health = healthCheckScheduler.getCurrentHealth()
        val alerts = alertService.getRecentAlerts(100)

        val criticalCount = alerts.count { it.level == AlertLevel.CRITICAL && !it.acknowledged }
        val warningCount = alerts.count { it.level == AlertLevel.WARNING && !it.acknowledged }

        val containerStats = health.docker?.containers?.let { containers ->
            ContainerStats(
                total = containers.size,
                running = containers.count { it.isRunning },
                stopped = containers.count { !it.isRunning && it.state != "not-found" },
                notFound = containers.count { it.state == "not-found" }
            )
        }

        val runnerStats = RunnerStats(
            total = health.runners.size,
            online = health.runners.count { it.isOnline },
            offline = health.runners.count { !it.isOnline },
            busy = health.runners.count { it.isBusy }
        )

        return ResponseEntity.ok(
            DashboardSummary(
                overallStatus = health.overallStatus,
                system = health.system?.let { metrics ->
                    SystemSummary(
                        cpuUsage = metrics.cpuUsage,
                        ramUsage = metrics.ramUsage,
                        ssdUsage = metrics.ssdUsage,
                        batteryLevel = metrics.batteryLevel,
                        isPowerConnected = metrics.isPowerConnected
                    )
                },
                docker = DockerSummary(
                    isDaemonRunning = health.docker?.isDaemonRunning ?: false,
                    containers = containerStats
                ),
                runners = runnerStats,
                alerts = AlertSummary(
                    critical = criticalCount,
                    warning = warningCount,
                    total = alerts.size
                ),
                timestamp = health.timestamp
            )
        )
    }
}

// Summary DTOs
data class DashboardSummary(
    val overallStatus: OverallStatus,
    val system: SystemSummary?,
    val docker: DockerSummary,
    val runners: RunnerStats,
    val alerts: AlertSummary,
    val timestamp: java.time.Instant
)

data class SystemSummary(
    val cpuUsage: Double,
    val ramUsage: Double,
    val ssdUsage: Double,
    val batteryLevel: Int?,
    val isPowerConnected: Boolean?
)

data class DockerSummary(
    val isDaemonRunning: Boolean,
    val containers: ContainerStats?
)

data class ContainerStats(
    val total: Int,
    val running: Int,
    val stopped: Int,
    val notFound: Int
)

data class RunnerStats(
    val total: Int,
    val online: Int,
    val offline: Int,
    val busy: Int
)

data class AlertSummary(
    val critical: Int,
    val warning: Int,
    val total: Int
)
