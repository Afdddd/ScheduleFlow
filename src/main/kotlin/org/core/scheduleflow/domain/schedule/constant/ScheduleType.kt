package org.core.scheduleflow.domain.schedule.constant

enum class ScheduleType(val description: String) {
    PROJECT("프로젝트 일정"),
    TEST_RUN("시운전"),
    WIRING("전기 배선"),
    DESIGN("설계"),
    MEETING("미팅")
}