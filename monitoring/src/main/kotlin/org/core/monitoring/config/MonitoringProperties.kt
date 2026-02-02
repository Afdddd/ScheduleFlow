package org.core.monitoring.config

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "monitoring")
data class MonitoringProperties(
    val allowedIps: List<String> = listOf("127.0.0.1"),
    val thresholds: ThresholdProperties = ThresholdProperties(),
    val intervals: IntervalProperties = IntervalProperties(),
    val alertCooldown: Long = 300000,
    val metricsRetentionMinutes: Int = 10,
    val alertHistorySize: Int = 100,
    val slack: SlackProperties = SlackProperties(),
    val github: GitHubProperties = GitHubProperties(),
    val docker: DockerProperties = DockerProperties()
)

data class ThresholdProperties(
    val cpu: Int = 80,
    val ram: Int = 80,
    val ssd: Int = 80,
    val battery: Int = 20
)

data class IntervalProperties(
    val systemResource: Long = 60000,
    val docker: Long = 30000,
    val githubRunner: Long = 300000
)

data class SlackProperties(
    val webhookUrl: String = "",
    val channel: String = "",
    val enabled: Boolean = true
)

data class GitHubProperties(
    val token: String = "",
    val owner: String = "",
    val repo: String = ""
)

data class DockerProperties(
    val host: String = "unix:///var/run/docker.sock",
    val monitoredContainers: List<String> = listOf("scheduleflow-backend", "scheduleflow-frontend", "scheduleflow-nginx", "scheduleflow-db")
)
