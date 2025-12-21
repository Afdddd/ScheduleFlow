package org.core.scheduleflow.global.exception

import org.springframework.http.HttpStatus

enum class ErrorCode(
    val httpStatus: HttpStatus,
    val message: String
) {
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "아이디 또는 비밀번호가 올바르지 않습니다."),
    INVALID_ACCESS_TOKEN(HttpStatus.UNAUTHORIZED, "ACCESS 토큰이 유효하지 않습니다."),
    NOT_FOUND_USER(HttpStatus.NOT_FOUND, "해당 회원이 존재하지 않습니다."),
    NOT_AUTHORIZED(HttpStatus.UNAUTHORIZED, "권한이 없습니다."),
    PERMISSION_DENIED(HttpStatus.FORBIDDEN, "접근 권한이 없습니다."),
    DUPLICATE_USERNAME(HttpStatus.CONFLICT, "이미 존재 하는 아이디 입니다."),

    DUPLICATE_PROJECT(HttpStatus.CONFLICT, "이미 존재하는 프로젝트입니다."),
    NOT_FOUND_PARTNER(HttpStatus.NOT_FOUND, "해당 거래처를 찾을 수 없습니다."),
    NOT_FOUND_PARTNER_CONTACT(HttpStatus.NOT_FOUND, "해당 거래처 직원을 찾을 수 없습니다."),
    NOT_FOUND_PROJECT(HttpStatus.NOT_FOUND, "해당 프로젝트를 찾을 수 없습니다."),



    ;

    val statusName: String get() = httpStatus.name
}