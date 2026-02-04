package org.core.monitoring.domain

import java.time.Instant

// Alert Levels
enum class AlertLevel {
    WARNING,  // 경고
    CRITICAL  // 장애
}

// Alert Types
enum class AlertType {
    CPU_HIGH,
    RAM_HIGH,
    SSD_HIGH,
    BATTERY_LOW,
    DOCKER_DAEMON_DOWN,
    CONTAINER_DOWN,
    CONTAINER_RESTARTING,
    GITHUB_RUNNER_OFFLINE,
    APPLICATION_ERROR
}

// System Metrics
data class SystemMetrics(
    val cpuUsage: Double,
    val ramUsage: Double,
    val ramTotal: Long,
    val ramUsed: Long,
    val ssdUsage: Double,
    val ssdTotal: Long,
    val ssdUsed: Long,
    val batteryLevel: Int?,
    val isPowerConnected: Boolean?,
    val timestamp: Instant = Instant.now()
)

// Docker Container Status
data class ContainerStatus(
    val name: String,
    val id: String,
    val state: String,
    val status: String,
    val isRunning: Boolean,
    val isRestarting: Boolean,
    val restartCount: Int,
    val timestamp: Instant = Instant.now()
)

// Docker Overall Status
data class DockerStatus(
    val isDaemonRunning: Boolean,
    val containers: List<ContainerStatus>,
    val timestamp: Instant = Instant.now()
)

// GitHub Runner Status
data class GitHubRunnerStatus(
    val id: Long,
    val name: String,
    val status: String,
    val isOnline: Boolean,
    val isBusy: Boolean,
    val labels: List<String>,
    val timestamp: Instant = Instant.now()
)

// Alert Record
data class Alert(
    val id: String,
    val type: AlertType,
    val level: AlertLevel,
    val message: String,
    val details: Map<String, Any> = emptyMap(),
    val timestamp: Instant = Instant.now(),
    val acknowledged: Boolean = false
)

// Health Check Result
data class HealthCheckResult(
    val component: String,
    val isHealthy: Boolean,
    val message: String,
    val details: Map<String, Any> = emptyMap(),
    val timestamp: Instant = Instant.now()
)

// Overall System Health
data class SystemHealth(
    val system: SystemMetrics?,
    val docker: DockerStatus?,
    val runners: List<GitHubRunnerStatus>,
    val recentAlerts: List<Alert>,
    val overallStatus: OverallStatus,
    val timestamp: Instant = Instant.now()
)

enum class OverallStatus {
    HEALTHY,
    WARNING,
    CRITICAL,
    UNKNOWN
}
