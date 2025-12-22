package org.core.scheduleflow.global.exception

import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.web.access.AccessDeniedHandler
import org.springframework.stereotype.Component
import tools.jackson.databind.ObjectMapper

@Component
class JwtAccessDeniedHandler(
    private val objectMapper: ObjectMapper
): AccessDeniedHandler {
    override fun handle(
        request: HttpServletRequest,
        response: HttpServletResponse,
        accessDeniedException: AccessDeniedException
    ) {
        val errorCode = ErrorCode.PERMISSION_DENIED

        val body = ErrorResponse(
            status = errorCode.httpStatus.value(),
            message = errorCode.message,
            path = request.requestURI
        )

        response.status = errorCode.httpStatus.value()
        response.contentType = "application/json;charset=UTF-8"
        response.writer.write(
            objectMapper.writeValueAsString(body)
        )
    }
}