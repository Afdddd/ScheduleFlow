package org.core.scheduleflow.global.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.data.domain.AuditorAware
import org.springframework.data.jpa.repository.config.EnableJpaAuditing
import org.springframework.security.core.context.SecurityContextHolder
import java.util.Optional

@Configuration
@EnableJpaAuditing
class JpaAuditingConfig {

    @Bean
    fun auditorAware() : AuditorAware<String> = AuditorAware {
        SecurityContextHolder.getContext().authentication?.name?.let { Optional.of(it) } ?: Optional.of("SYSTEM")
    }
}