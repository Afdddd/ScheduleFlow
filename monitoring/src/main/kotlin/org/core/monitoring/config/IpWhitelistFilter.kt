package org.core.monitoring.config

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter


@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class IpWhitelistFilter(
    private val properties: MonitoringProperties
) : OncePerRequestFilter() {

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        val requestPath = request.requestURI

        // Only apply to /admin paths
        if (!requestPath.startsWith("/admin")) {
            filterChain.doFilter(request, response)
            return
        }

        val clientIp = getClientIp(request)

        if (isIpAllowed(clientIp)) {
            filterChain.doFilter(request, response)
        } else {
            logger.warn { "Access denied for IP: $clientIp to path: $requestPath" }
            response.status = HttpServletResponse.SC_FORBIDDEN
            response.contentType = "application/json"
            response.writer.write("""{"error": "Access denied", "message": "Your IP is not whitelisted"}""")
        }
    }

    private fun getClientIp(request: HttpServletRequest): String {
        // Check for proxy headers

        // 거쳐온 모든 경로의 IP 리스트를 담는 표준 [사용자 IP, 첫 번째 프록시 IP, 두 번째 프록시 IP]
        val xForwardedFor = request.getHeader("X-Forwarded-For")
        if (!xForwardedFor.isNullOrBlank()) {
            // 제일 앞에 있는 사용자 ip를 추출
            return xForwardedFor.split(",")[0].trim()
        }

        // 바로 직전에서 보낸 IP (만약 사용자 -> Cloudflare -> nginx -> 서버 순이라면 Cloudflare의 IP가 반환된다.) 확실한 X-Forwarded-For 먼저 검사
        val xRealIp = request.getHeader("X-Real-IP")
        if (!xRealIp.isNullOrBlank()) {
            return xRealIp.trim()
        }

        return request.remoteAddr ?: "unknown"
    }

    private fun isIpAllowed(clientIp: String): Boolean {
        for (allowedIp in properties.allowedIps) {
            if (clientIp == allowedIp) {
                return true
            }
        }
        return false
    }
}
