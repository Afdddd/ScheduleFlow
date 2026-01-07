package org.core.scheduleflow.domain.partner.dto


data class PartnerListResponse(
    val id: Long,
    val companyName: String,             // 회사명
    val mainPhone: String?,              // 대표 전화번호
    val address: String?                 // 주소
)