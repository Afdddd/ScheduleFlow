package org.core.monitoring.docker

import com.github.dockerjava.api.DockerClient
import com.github.dockerjava.api.exception.DockerException
import io.github.oshai.kotlinlogging.KotlinLogging
import org.core.monitoring.config.MonitoringProperties
import org.core.monitoring.domain.ContainerStatus
import org.core.monitoring.domain.DockerStatus
import org.springframework.stereotype.Component

private val logger = KotlinLogging.logger {}

@Component
class DockerHealthChecker(
    private val dockerClient: DockerClient,
    private val properties: MonitoringProperties
) {

    fun checkHealth(): DockerStatus {
        return try {
            // ping check
            dockerClient.pingCmd().exec()

            // 컨테이너 가져오기
            val containers = dockerClient.listContainersCmd()
                .withShowAll(true)
                .exec()

            val monitoredContainers = properties.docker.monitoredContainers
            val containerStatuses = containers
                .filter { container ->
                    container.names?.any { name ->
                        monitoredContainers.any { monitored ->
                            name.contains(monitored, ignoreCase = true)
                        }
                    } ?: false
                }
                .map { container ->
                    val name = container.names?.firstOrNull()?.removePrefix("/") ?: "unknown"
                    ContainerStatus(
                        name = name,
                        id = container.id?.take(12) ?: "unknown",
                        state = container.state ?: "unknown",
                        status = container.status ?: "unknown",
                        isRunning = container.state == "running",
                        isRestarting = container.state == "restarting",
                        restartCount = extractRestartCount(container.status)
                    )
                }

            // Add missing containers as "not found"
            val foundNames = containerStatuses.map { it.name.lowercase() }
            val missingContainers = monitoredContainers
                .filter { !foundNames.any { found -> found.contains(it.lowercase()) } }
                .map { name ->
                    ContainerStatus(
                        name = name,
                        id = "not-found",
                        state = "not-found",
                        status = "Container not found",
                        isRunning = false,
                        isRestarting = false,
                        restartCount = 0
                    )
                }

            DockerStatus(
                isDaemonRunning = true,
                containers = containerStatuses + missingContainers
            ).also {
                logger.debug { "Docker health check: daemon=running, containers=${it.containers.size}" }
            }
        } catch (e: DockerException) {
            logger.error(e) { "Docker daemon is not accessible" }
            DockerStatus(
                isDaemonRunning = false,
                containers = emptyList()
            )
        } catch (e: Exception) {
            logger.error(e) { "Failed to check Docker health" }
            DockerStatus(
                isDaemonRunning = false,
                containers = emptyList()
            )
        }
    }

    private fun extractRestartCount(status: String?): Int {
        // Status format: "Up 2 hours (Restarting)" or includes restart info
        if (status == null) return 0
        val regex = Regex("Restart.*?(\\d+)")
        return regex.find(status)?.groupValues?.getOrNull(1)?.toIntOrNull() ?: 0
    }
}
