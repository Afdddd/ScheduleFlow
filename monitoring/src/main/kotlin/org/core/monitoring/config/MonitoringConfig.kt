package org.core.monitoring.config

import com.github.dockerjava.api.DockerClient
import com.github.dockerjava.core.DefaultDockerClientConfig
import com.github.dockerjava.core.DockerClientImpl
import com.github.dockerjava.httpclient5.ApacheDockerHttpClient
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.reactive.function.client.WebClient
import java.net.URI
import java.time.Duration

private val logger = KotlinLogging.logger {}

@Configuration
@EnableConfigurationProperties(MonitoringProperties::class)
class MonitoringConfig(
    private val properties: MonitoringProperties
) {

    @Bean
    fun webClient(): WebClient {
        return WebClient.builder()
            .build()
    }

    @Bean
    fun dockerClient(): DockerClient {
        // Determine Docker host - check common socket locations
        val dockerHost = findDockerHost()
        logger.info { "Using Docker host: $dockerHost" }

        val config = DefaultDockerClientConfig.createDefaultConfigBuilder()
            .withDockerHost(dockerHost)
            .build()

        val httpClient = ApacheDockerHttpClient.Builder()
            .dockerHost(URI.create(dockerHost))
            .connectionTimeout(Duration.ofSeconds(5))
            .responseTimeout(Duration.ofSeconds(10))
            .build()

        return DockerClientImpl.getInstance(config, httpClient)
    }

    private fun findDockerHost(): String {
        val configuredHost = properties.docker.host
        if (configuredHost.isNotBlank() && !configuredHost.contains("auto")) {
            return configuredHost
        }

        // auto 라면 윈도우 설정으로 반환
        logger.info { "Using Windows named pipe for Docker" }
        return "npipe:////./pipe/docker_engine"
    }
}
