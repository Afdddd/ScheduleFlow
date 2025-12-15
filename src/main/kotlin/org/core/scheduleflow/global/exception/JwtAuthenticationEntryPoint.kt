package org.core.scheduleflow.global.exception

import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.core.AuthenticationException
import org.springframework.security.web.AuthenticationEntryPoint
import org.springframework.stereotype.Component
import tools.jackson.databind.ObjectMapper

@Component
class JwtAuthenticationEntryPoint(
    private val objectMapper: ObjectMapper
) : AuthenticationEntryPoint {
    override fun commence(
        request: HttpServletRequest,
        response: HttpServletResponse,
        authException: AuthenticationException
    ) {

        val errorCode = ErrorCode.NOT_AUTHORIZED
        val body = ErrorResponse(
            status = errorCode.getHttpStatus().value(),
            message = errorCode.getMessage(),
            path = request.requestURI
        )
        response.status = errorCode.getHttpStatus().value()
        response.contentType = "application/json;charset=UTF-8"
        response.writer.write(
            objectMapper.writeValueAsString(body)
        )
    }
}