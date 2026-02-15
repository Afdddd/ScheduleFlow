description = "ScheduleFlow Monitoring"

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-webflux")
    implementation("org.springframework.boot:spring-boot-starter-thymeleaf")

    // System Resource & Docker
    implementation("com.github.oshi:oshi-core:6.6.5")
    implementation("com.github.docker-java:docker-java-core:3.7.0")
    implementation("com.github.docker-java:docker-java-transport-httpclient5:3.7.0")
}

tasks.bootJar {
    archiveFileName.set("monitoring.jar")
}