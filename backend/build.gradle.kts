plugins {
    kotlin("plugin.jpa")
    kotlin("kapt")
}

description = "ScheduleFlow Core Service"

dependencies {
    // JWT (Clean up)
    val jjwtVersion = "0.12.6"
    implementation("io.jsonwebtoken:jjwt-api:$jjwtVersion")
    runtimeOnly("io.jsonwebtoken:jjwt-impl:$jjwtVersion")
    runtimeOnly("io.jsonwebtoken:jjwt-jackson:$jjwtVersion")

    // Spring Data & Web
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-validation")

    // Swagger
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.8.4")

    // DB Migration
    // Spring Boot 4.0은 자동설정을 모듈로 분리 — flyway-core만으론 FlywayAutoConfiguration이
    // 클래스패스에 없어 Flyway가 아예 실행되지 않는다. 통합 모듈을 반드시 함께 넣어야 한다.
    implementation("org.springframework.boot:spring-boot-flyway")
    implementation("org.flywaydb:flyway-core")
    implementation("org.flywaydb:flyway-mysql")

    runtimeOnly("com.mysql:mysql-connector-j")
    testImplementation("org.springframework.boot:spring-boot-starter-webmvc-test")
    testImplementation("org.springframework.boot:spring-boot-starter-security-test")
    testImplementation("io.kotest.extensions:kotest-extensions-spring:1.3.0")
    testRuntimeOnly("com.h2database:h2")

    // AWS SDK v2 - S3
    implementation(platform("software.amazon.awssdk:bom:2.46.20"))
    implementation("software.amazon.awssdk:s3")
}

kotlin {
    compilerOptions {
        freeCompilerArgs.addAll("-Xannotation-default-target=param-property")
    }
}

tasks.withType<Test> {
    jvmArgs(
        "--add-opens", "java.base/java.lang.reflect=ALL-UNNAMED",
        "--add-opens", "java.base/java.lang=ALL-UNNAMED",
        "--add-opens", "java.base/java.nio.file=ALL-UNNAMED"
    )
}