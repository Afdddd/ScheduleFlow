package org.core.scheduleflow.global.config

import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import software.amazon.awssdk.regions.Region
import software.amazon.awssdk.services.s3.S3Client

@Configuration
@ConditionalOnProperty(name = ["storage.type"], havingValue = "s3")
class S3Config(
    @Value("\${aws.region}") private val region: String,
) {
    @Bean
    fun s3Client(): S3Client =
        S3Client.builder()
            .region(Region.of(region))
            .build()
    // DefaultCredentialsProvider가 aws cli 설정(~/.aws/credentials) 자동으로 자격증명을 탐색.
}