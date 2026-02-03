package org.core.monitoring.alert

import io.github.oshai.kotlinlogging.KotlinLogging
import org.core.monitoring.config.MonitoringProperties
import org.core.monitoring.domain.Alert
import org.core.monitoring.domain.AlertLevel
import org.core.monitoring.domain.AlertType
import org.springframework.http.MediaType
import org.springframework.stereotype.Service
import org.springframework.web.reactive.function.client.WebClient
import java.time.Instant
import java.util.*
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.ConcurrentLinkedDeque

private val logger = KotlinLogging.logger {}

@Service
class AlertService(
    private val webClient: WebClient,
    private val properties: MonitoringProperties
) {

    // Alert history (thread-safe, limited size)
    private val alertHistory = ConcurrentLinkedDeque<Alert>()

    // Cooldown tracking: AlertType -> last alert timestamp
    private val lastAlertTimes = ConcurrentHashMap<AlertType, Instant>()

    fun sendAlert(type: AlertType, level: AlertLevel, message: String, details: Map<String, Any> = emptyMap()) {
        // Check cooldown
        if (isInCooldown(type)) {
            logger.debug { "Alert suppressed (cooldown): $type" }
            return
        }

        val alert = Alert(
            id = UUID.randomUUID().toString(),
            type = type,
            level = level,
            message = message,
            details = details
        )

        // Store in history
        addToHistory(alert)

        // Update cooldown
        lastAlertTimes[type] = Instant.now()

        // Send to Slack
        sendSlackNotification(alert)

        logger.info { "Alert sent: [$level] $type - $message" }
    }

    fun getRecentAlerts(limit: Int = 20): List<Alert> {
        return alertHistory.take(limit)
    }

    fun getAllAlerts(): List<Alert> {
        return alertHistory.toList()
    }

    fun acknowledgeAlert(alertId: String): Boolean {
        val alert = alertHistory.find { it.id == alertId }
        if (alert != null) {
            // Create acknowledged version and replace
            val index = alertHistory.indexOf(alert)
            if (index >= 0) {
                alertHistory.remove(alert)
                alertHistory.addFirst(alert.copy(acknowledged = true))
                return true
            }
        }
        return false
    }

    private fun isInCooldown(type: AlertType): Boolean {
        val lastTime = lastAlertTimes[type] ?: return false
        val elapsed = Instant.now().toEpochMilli() - lastTime.toEpochMilli()
        return elapsed < properties.alertCooldown
    }

    private fun addToHistory(alert: Alert) {
        alertHistory.addFirst(alert)
        // Trim to max size
        while (alertHistory.size > properties.alertHistorySize) {
            alertHistory.removeLast()
        }
    }

    private fun sendSlackNotification(alert: Alert) {
        val webhookUrl = properties.slack.webhookUrl
        if (webhookUrl.isBlank() || !properties.slack.enabled) {
            logger.debug { "Slack notification skipped (not configured or disabled)" }
            return
        }

        val emoji = when (alert.level) {
            AlertLevel.CRITICAL -> ":red_circle:"
            AlertLevel.WARNING -> ":warning:"
        }

        val levelText = when (alert.level) {
            AlertLevel.CRITICAL -> "장애"
            AlertLevel.WARNING -> "경고"
        }

        val payload = SlackPayload(
            channel = properties.slack.channel,
            username = "ScheduleFlow Monitor",
            icon_emoji = ":robot_face:",
            attachments = listOf(
                SlackAttachment(
                    color = if (alert.level == AlertLevel.CRITICAL) "danger" else "warning",
                    title = "$emoji [$levelText] ${alert.type.name}",
                    text = alert.message,
                    fields = alert.details.map { (key, value) ->
                        SlackField(title = key, value = value.toString(), short = true)
                    },
                    ts = alert.timestamp.epochSecond.toString()
                )
            )
        )

        try {
            webClient.post()
                .uri(webhookUrl)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(String::class.java)
                .subscribe(
                    { logger.debug { "Slack notification sent successfully" } },
                    { e -> logger.error(e) { "Failed to send Slack notification" } }
                )
        } catch (e: Exception) {
            logger.error(e) { "Failed to send Slack notification" }
        }
    }
}

// Slack Webhook DTOs
data class SlackPayload(
    val channel: String,
    val username: String,
    val icon_emoji: String,
    val attachments: List<SlackAttachment>
)

data class SlackAttachment(
    val color: String,
    val title: String,
    val text: String,
    val fields: List<SlackField>,
    val ts: String
)

data class SlackField(
    val title: String,
    val value: String,
    val short: Boolean
)
