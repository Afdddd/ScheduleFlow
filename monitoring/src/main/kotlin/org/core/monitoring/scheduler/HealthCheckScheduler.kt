package org.core.monitoring.scheduler

import io.github.oshai.kotlinlogging.KotlinLogging
import org.core.monitoring.alert.AlertService
import org.core.monitoring.collector.SystemResourceCollector
import org.core.monitoring.config.MonitoringProperties
import org.core.monitoring.docker.DockerHealthChecker
import org.core.monitoring.domain.*
import org.core.monitoring.github.GitHubRunnerChecker
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import java.time.Instant
import java.util.concurrent.ConcurrentLinkedDeque

private val logger = KotlinLogging.logger {}

@Component
class HealthCheckScheduler(
    private val systemResourceCollector: SystemResourceCollector,
    private val dockerHealthChecker: DockerHealthChecker,
    private val gitHubRunnerChecker: GitHubRunnerChecker,
    private val alertService: AlertService,
    private val properties: MonitoringProperties
) {
    // In-memory metrics storage (last 10 minutes)
    private val systemMetricsHistory = ConcurrentLinkedDeque<SystemMetrics>()
    private val dockerStatusHistory = ConcurrentLinkedDeque<DockerStatus>()
    private val runnerStatusHistory = ConcurrentLinkedDeque<List<GitHubRunnerStatus>>()

    // Latest status cache
    @Volatile
    private var latestSystemMetrics: SystemMetrics? = null

    @Volatile
    private var latestDockerStatus: DockerStatus? = null

    @Volatile
    private var latestRunnerStatus: List<GitHubRunnerStatus> = emptyList()

    @Scheduled(fixedRateString = "\${monitoring.intervals.system-resource:60000}")
    fun checkSystemResources() {
        logger.debug { "Running system resource check..." }

        try {
            val metrics = systemResourceCollector.collect()
            latestSystemMetrics = metrics
            addToHistory(systemMetricsHistory, metrics, properties.metricsRetentionMinutes)

            // Check thresholds and send alerts
            checkSystemThresholds(metrics)
        } catch (e: Exception) {
            logger.error(e) { "Failed to collect system metrics" }
        }
    }

    @Scheduled(fixedRateString = "\${monitoring.intervals.docker:30000}")
    fun checkDocker() {
        logger.debug { "Running Docker health check..." }

        try {
            val status = dockerHealthChecker.checkHealth()
            latestDockerStatus = status
            addToHistory(dockerStatusHistory, status, properties.metricsRetentionMinutes)

            // Check Docker health and send alerts
            checkDockerHealth(status)
        } catch (e: Exception) {
            logger.error(e) { "Failed to check Docker health" }
        }
    }

    @Scheduled(fixedRateString = "\${monitoring.intervals.github-runner:300000}")
    fun checkGitHubRunners() {
        logger.debug { "Running GitHub Runner check..." }

        try {
            val runners = gitHubRunnerChecker.checkRunners()
            latestRunnerStatus = runners
            addToHistory(runnerStatusHistory, runners, properties.metricsRetentionMinutes)

            // Check runner status and send alerts
            checkRunnerHealth(runners)
        } catch (e: Exception) {
            logger.error(e) { "Failed to check GitHub runners" }
        }
    }

    fun getCurrentHealth(): SystemHealth {
        val recentAlerts = alertService.getRecentAlerts(10)

        val overallStatus = determineOverallStatus(
            latestSystemMetrics,
            latestDockerStatus,
            latestRunnerStatus,
            recentAlerts
        )

        return SystemHealth(
            system = latestSystemMetrics,
            docker = latestDockerStatus,
            runners = latestRunnerStatus,
            recentAlerts = recentAlerts,
            overallStatus = overallStatus
        )
    }

    fun getSystemMetricsHistory(): List<SystemMetrics> = systemMetricsHistory.toList()
    fun getDockerStatusHistory(): List<DockerStatus> = dockerStatusHistory.toList()
    fun getRunnerStatusHistory(): List<List<GitHubRunnerStatus>> = runnerStatusHistory.toList()

    private fun checkSystemThresholds(metrics: SystemMetrics) {
        val thresholds = properties.thresholds

        // CPU check
        if (metrics.cpuUsage > thresholds.cpu) {
            alertService.sendAlert(
                type = AlertType.CPU_HIGH,
                level = AlertLevel.WARNING,
                message = "CPU 사용량이 ${thresholds.cpu}%를 초과했습니다: ${String.format("%.1f", metrics.cpuUsage)}%",
                details = mapOf("current" to metrics.cpuUsage, "threshold" to thresholds.cpu)
            )
        }

        // RAM check
        if (metrics.ramUsage > thresholds.ram) {
            alertService.sendAlert(
                type = AlertType.RAM_HIGH,
                level = AlertLevel.WARNING,
                message = "메모리 사용량이 ${thresholds.ram}%를 초과했습니다: ${String.format("%.1f", metrics.ramUsage)}%",
                details = mapOf(
                    "current" to metrics.ramUsage,
                    "threshold" to thresholds.ram,
                    "used_gb" to String.format("%.1f", metrics.ramUsed / 1_073_741_824.0),
                    "total_gb" to String.format("%.1f", metrics.ramTotal / 1_073_741_824.0)
                )
            )
        }

        // SSD check
        if (metrics.ssdUsage > thresholds.ssd) {
            alertService.sendAlert(
                type = AlertType.SSD_HIGH,
                level = AlertLevel.WARNING,
                message = "디스크 사용량이 ${thresholds.ssd}%를 초과했습니다: ${String.format("%.1f", metrics.ssdUsage)}%",
                details = mapOf(
                    "current" to metrics.ssdUsage,
                    "threshold" to thresholds.ssd,
                    "used_gb" to String.format("%.1f", metrics.ssdUsed / 1_073_741_824.0),
                    "total_gb" to String.format("%.1f", metrics.ssdTotal / 1_073_741_824.0)
                )
            )
        }

        // Battery check (only if not connected to power)
        if (metrics.batteryLevel != null && metrics.isPowerConnected == false) {
            if (metrics.batteryLevel < thresholds.battery) {
                alertService.sendAlert(
                    type = AlertType.BATTERY_LOW,
                    level = AlertLevel.WARNING,
                    message = "배터리 잔량이 ${thresholds.battery}% 미만입니다: ${metrics.batteryLevel}% (전원 미연결)",
                    details = mapOf(
                        "current" to metrics.batteryLevel,
                        "threshold" to thresholds.battery,
                        "power_connected" to false
                    )
                )
            }
        }
    }

    private fun checkDockerHealth(status: DockerStatus) {
        // Docker daemon check
        if (!status.isDaemonRunning) {
            alertService.sendAlert(
                type = AlertType.DOCKER_DAEMON_DOWN,
                level = AlertLevel.CRITICAL,
                message = "Docker 데몬이 응답하지 않습니다!",
                details = mapOf("status" to "down")
            )
            return
        }

        // Container checks
        for (container in status.containers) {
            if (!container.isRunning && container.state != "not-found") {
                alertService.sendAlert(
                    type = AlertType.CONTAINER_DOWN,
                    level = AlertLevel.CRITICAL,
                    message = "컨테이너 '${container.name}'이(가) 중지되었습니다",
                    details = mapOf(
                        "container" to container.name,
                        "state" to container.state,
                        "status" to container.status
                    )
                )
            }

            if (container.isRestarting) {
                alertService.sendAlert(
                    type = AlertType.CONTAINER_RESTARTING,
                    level = AlertLevel.CRITICAL,
                    message = "컨테이너 '${container.name}'이(가) 재시작 중입니다",
                    details = mapOf(
                        "container" to container.name,
                        "restart_count" to container.restartCount
                    )
                )
            }
        }
    }

    private fun checkRunnerHealth(runners: List<GitHubRunnerStatus>) {
        for (runner in runners) {
            if (!runner.isOnline) {
                alertService.sendAlert(
                    type = AlertType.GITHUB_RUNNER_OFFLINE,
                    level = AlertLevel.CRITICAL,
                    message = "GitHub Runner '${runner.name}'이(가) 오프라인입니다",
                    details = mapOf(
                        "runner" to runner.name,
                        "status" to runner.status
                    )
                )
            }
        }
    }

    private fun determineOverallStatus(
        system: SystemMetrics?,
        docker: DockerStatus?,
        runners: List<GitHubRunnerStatus>,
        alerts: List<Alert>
    ): OverallStatus {
        // Check for recent critical alerts
        val recentCritical = alerts.any {
            it.level == AlertLevel.CRITICAL &&
            it.timestamp.isAfter(Instant.now().minusSeconds(300))
        }
        if (recentCritical) return OverallStatus.CRITICAL

        // Check Docker
        if (docker != null && !docker.isDaemonRunning) return OverallStatus.CRITICAL
        if (docker?.containers?.any { !it.isRunning && it.state != "not-found" } == true) return OverallStatus.CRITICAL

        // Check runners
        if (runners.any { !it.isOnline }) return OverallStatus.CRITICAL

        // Check for warnings
        val recentWarning = alerts.any {
            it.level == AlertLevel.WARNING &&
            it.timestamp.isAfter(Instant.now().minusSeconds(300))
        }
        if (recentWarning) return OverallStatus.WARNING

        // If no data, status is unknown
        if (system == null && docker == null) return OverallStatus.UNKNOWN

        return OverallStatus.HEALTHY
    }

    private fun <T> addToHistory(
        history: ConcurrentLinkedDeque<T>,
        item: T,
        retentionMinutes: Int
    ) {
        history.addFirst(item)

        // Calculate max items based on shortest interval (30 seconds for Docker)
        val maxItems = (retentionMinutes * 60 / 30) + 10 // Add buffer
        while (history.size > maxItems) {
            history.removeLast()
        }
    }
}
