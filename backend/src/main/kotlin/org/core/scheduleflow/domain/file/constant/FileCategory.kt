package org.core.scheduleflow.domain.file.constant

enum class FileCategory(val description: String) {
    QUOTATION("견적서"),
    DRAWING("회로도"),
    PLC_PROGRAM("PLC 프로그램"),
    BOM("자재표"),
    HMI_DESIGN("HMI 작화")
}