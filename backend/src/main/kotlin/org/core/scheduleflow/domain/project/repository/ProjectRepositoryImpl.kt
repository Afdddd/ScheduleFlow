package org.core.scheduleflow.domain.project.repository

import com.querydsl.jpa.impl.JPAQueryFactory
import org.springframework.stereotype.Repository

@Repository
class ProjectRepositoryImpl(
    private val queryFactory: JPAQueryFactory
) : ProjectRepositoryCustom
