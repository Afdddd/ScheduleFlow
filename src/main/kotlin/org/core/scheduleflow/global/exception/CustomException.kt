package org.core.scheduleflow.global.exception

class CustomException(
    val errorCode: ErrorCode
) : RuntimeException(errorCode.message)