package org.core.scheduleflow.global.exception

import org.springframework.http.HttpStatus

enum class ErrorCode(
    private val httpStatus: HttpStatus,
    private val message: String
) {
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "아이디 또는 비밀번호가 올바르지 않습니다."),
    INVALID_ACCESS_TOKEN(HttpStatus.UNAUTHORIZED, "ACCESS 토큰이 유효하지 않습니다."),
    NOT_FOUND_USER(HttpStatus.NOT_FOUND, "해당 회원이 존재하지 않습니다."),
    NOT_AUTHORIZED(HttpStatus.UNAUTHORIZED, "권한이 없습니다."),
    PERMISSION_DENIED(HttpStatus.FORBIDDEN, "접근 권한이 없습니다."),
    DUPLICATE_USERNAME(HttpStatus.CONFLICT, "이미 존재 하는 아이디 입니다.");

    fun getHttpStatus(): HttpStatus = httpStatus
    fun getMessage(): String = message
    fun getStatusName(): String = httpStatus.name
}