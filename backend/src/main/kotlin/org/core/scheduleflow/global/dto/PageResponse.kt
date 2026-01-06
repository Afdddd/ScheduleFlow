package org.core.scheduleflow.global.dto

import org.springframework.data.domain.Page


data class PageResponse<T>(
    val content: List<T>,
    val totalElements: Long,
    val totalPages: Int,
    val currentPage: Int,
    val pageSize: Int,
    val hasNext: Boolean,
    val hasPrevious: Boolean
) {
    companion object {
        fun <T : Any> from(page: Page<T>): PageResponse<T> {
            return PageResponse(
                content = page.content,
                totalElements = page.totalElements,
                totalPages = page.totalPages,
                currentPage = page.number,
                pageSize = page.size,
                hasNext = page.hasNext(),
                hasPrevious = page.hasPrevious()
            )
        }
    }
}

