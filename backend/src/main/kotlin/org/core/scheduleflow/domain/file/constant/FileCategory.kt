package org.core.scheduleflow.domain.file.constant

enum class FileCategory(val description: String) {
    QUOTATION("견적서"),
    DRAWING("회로도"),
    PLC_PROGRAM("PLC 프로그램"),
    BOM("자재표"),
    HMI_DESIGN("HMI 작화"),

    // 현장 사진·영상. 문서 카테고리와 달리 현장 사원(비-관리자)도 업로드할 수 있다.
    // (업로드 권한 분기는 FileController.uploadFile 참고)
    PHOTO("현장 사진")
}