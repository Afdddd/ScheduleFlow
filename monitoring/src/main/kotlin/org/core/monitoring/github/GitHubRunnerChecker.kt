package org.core.monitoring.github

import io.github.oshai.kotlinlogging.KotlinLogging
import org.core.monitoring.config.MonitoringProperties
import org.core.monitoring.domain.GitHubRunnerStatus
import org.springframework.stereotype.Component
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.reactive.function.client.WebClientResponseException

private val logger = KotlinLogging.logger {}

@Component
class GitHubRunnerChecker(
    private val webClient: WebClient,
    private val properties: MonitoringProperties
) {

    companion object {
        private const val GITHUB_API_BASE = "https://api.github.com"
    }

    fun checkRunners(): List<GitHubRunnerStatus> {
        val token = properties.github.token
        val owner = properties.github.owner
        val repo = properties.github.repo

        if (token.isBlank() || owner.isBlank() || repo.isBlank()) {
            logger.warn { "GitHub configuration is incomplete. Skipping runner check." }
            return emptyList()
        }

        return try {
            val response = webClient.get()
                .uri("$GITHUB_API_BASE/repos/$owner/$repo/actions/runners")
                .header("Authorization", "Bearer $token")
                .header("Accept", "application/vnd.github+json")
                .header("X-GitHub-Api-Version", "2022-11-28")
                .retrieve()
                .bodyToMono(GitHubRunnersResponse::class.java)
                .block()

            response?.runners?.map { runner ->
                GitHubRunnerStatus(
                    id = runner.id,
                    name = runner.name,
                    status = runner.status,
                    isOnline = runner.status == "online",
                    isBusy = runner.busy,
                    labels = runner.labels.map { it.name }
                )
            }.orEmpty().also {
                logger.debug { "GitHub runner check: found ${it.size} runners" }
            }
        } catch (e: WebClientResponseException) {
            logger.error { "GitHub API error: ${e.statusCode} - ${e.message}" }
            emptyList()
        } catch (e: Exception) {
            logger.error(e) { "Failed to check GitHub runners" }
            emptyList()
        }
    }
}

// DTOs for GitHub API response
data class GitHubRunnersResponse(
    val total_count: Int,
    val runners: List<GitHubRunner>
)

data class GitHubRunner(
    val id: Long,
    val name: String,
    val os: String,
    val status: String,
    val busy: Boolean,
    val labels: List<GitHubLabel>
)

data class GitHubLabel(
    val id: Long,
    val name: String,
    val type: String
)
