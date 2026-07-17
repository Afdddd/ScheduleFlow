# ===== Build Stage =====
FROM eclipse-temurin:21-jdk AS builder

WORKDIR /app

# Copy Gradle wrapper and build files
COPY gradlew gradlew
COPY gradle gradle
COPY settings.gradle.kts settings.gradle.kts
COPY build.gradle.kts build.gradle.kts

# Make gradlew executable
RUN chmod +x gradlew

# Download dependencies (cached layer)
RUN ./gradlew dependencies --no-daemon || true

# Copy source code
COPY src src

# Build the application
RUN ./gradlew bootJar --no-daemon -x test

# ===== Runtime Stage =====
FROM eclipse-temurin:21-jre

ARG SENTRY_RELEASE
ENV SENTRY_RELEASE=${SENTRY_RELEASE}

WORKDIR /app

# Set timezone
ENV TZ=Asia/Seoul
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Copy the built JAR from builder stage
COPY --from=builder /app/build/libs/*.jar app.jar

# Create non-root user for security
RUN groupadd -r appgroup && useradd -r -g appgroup appuser
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
