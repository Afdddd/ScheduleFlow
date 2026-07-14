package org.core.scheduleflow.global.config

import io.jsonwebtoken.Claims
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.data.domain.AuditorAware
import org.springframework.data.jpa.repository.config.EnableJpaAuditing
import org.springframework.security.core.context.SecurityContextHolder
import java.util.Optional

@Configuration
@EnableJpaAuditing
class JpaAuditingConfig {

    // principal이 jjwt Claims(Map)라 authentication.name은 맵 전체의 toString이 된다.
    // 반드시 subject(username)를 꺼내야 한다. 미인증(익명 포함)은 SYSTEM.
    @Bean
    fun auditorAware(): AuditorAware<String> = AuditorAware {
        val principal = SecurityContextHolder.getContext().authentication?.principal
        Optional.of((principal as? Claims)?.subject ?: "SYSTEM")
    }
}
