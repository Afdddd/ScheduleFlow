# ===== Build Stage =====
FROM eclipse-temurin:21-jdk AS builder

WORKDIR /app

# Copy Gradle wrapper and build files
COPY backend/gradlew backend/gradlew
COPY backend/gradle backend/gradle
COPY backend/build.gradle.kts backend/build.gradle.kts
COPY backend/settings.gradle.kts backend/settings.gradle.kts

# Make gradlew executable
RUN chmod +x backend/gradlew

# Download dependencies (cached layer)
WORKDIR /app/backend
RUN ./gradlew dependencies --no-daemon || true

# Copy source code
WORKDIR /app
COPY backend/src backend/src

# Build the application
WORKDIR /app/backend
RUN ./gradlew bootJar --no-daemon -x test

# ===== Runtime Stage =====
FROM eclipse-temurin:21-jre

WORKDIR /app

# Set timezone
ENV TZ=Asia/Seoul
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Copy the built JAR from builder stage
COPY --from=builder /app/backend/build/libs/*.jar app.jar

# Create non-root user for security
RUN groupadd -r appgroup && useradd -r -g appgroup appuser
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
