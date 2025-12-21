package org.core.scheduleflow.domain.project.repository

import com.querydsl.jpa.impl.JPAQueryFactory
import org.core.scheduleflow.domain.project.entity.Project
import org.core.scheduleflow.domain.project.entity.QProject
import org.springframework.stereotype.Repository

@Repository
class ProjectRepositoryImpl(
    private val queryFactory: JPAQueryFactory
) : ProjectRepositoryCustom {
    
    override fun findByIdWithClient(projectId: Long): Project? {
        val project = QProject.project
        
        return queryFactory
            .selectFrom(project)
            .leftJoin(project.client).fetchJoin()
            .where(project.id.eq(projectId))
            .fetchOne()
    }

    override fun findAllWithClient(): List<Project> {
        val project = QProject.project

        return queryFactory
            .selectFrom(project)
            .leftJoin(project.client).fetchJoin()
            .fetch()
    }
}

