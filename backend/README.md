# ScheduleFlow Backend

10인 미만 PLC 및 하드웨어 전장 설계 회사를 위한 경량 ERP 시스템의 백엔드 API 서버입니다.

## 기술 스택

- **언어**: Kotlin 2.2.21
- **프레임워크**: Spring Boot 4.0.0
- **Java**: OpenJDK 21
- **데이터베이스**: MySQL 8.0
- **ORM**: JPA (Hibernate)
- **인증**: JWT (jjwt 0.12.6)
- **보안**: Spring Security
- **빌드 도구**: Gradle (Kotlin DSL)
- **테스트**: Kotest, MockK

## 프로젝트 구조

```
backend/src/main/kotlin/org/core/scheduleflow/
├── SheduleFlowApplication.kt          # 애플리케이션 진입점
├── domain/                             # 도메인별 패키지
│   ├── user/                          # 사용자 및 인증
│   │   ├── controller/
│   │   │   ├── AuthController.kt      # 회원가입, 로그인
│   │   │   └── UserController.kt      # 사용자 CRUD, 팀 업무 조회
│   │   ├── service/
│   │   ├── repository/
│   │   ├── entity/
│   │   └── dto/
│   ├── project/                       # 프로젝트 관리
│   │   ├── controller/
│   │   │   └── ProjectController.kt   # 프로젝트 CRUD, 기간별 조회
│   │   ├── service/
│   │   ├── repository/
│   │   ├── entity/
│   │   └── dto/
│   ├── schedule/                      # 일정 관리
│   │   ├── controller/
│   │   │   └── ScheduleController.kt  # 일정 CRUD, 내 업무 조회
│   │   ├── service/
│   │   ├── repository/
│   │   ├── entity/
│   │   └── dto/
│   ├── partner/                       # 거래처 관리
│   │   ├── controller/
│   │   │   └── PartnerController.kt   # 거래처 CRUD
│   │   ├── service/
│   │   ├── repository/
│   │   ├── entity/
│   │   └── dto/
│   └── file/                          # 파일 관리
│       ├── controller/
│       │   └── FileController.kt      # 파일 업로드/다운로드
│       ├── service/
│       ├── repository/
│       ├── entity/
│       └── dto/
└── global/                            # 전역 설정 및 공통 기능
    ├── config/                        # 설정 클래스
    ├── security/                      # 보안 설정 (JWT 필터 등)
    ├── exception/                     # 전역 예외 처리
    ├── entity/                        # 공통 엔티티 (BaseEntity 등)
    └── dto/                           # 공통 DTO (PageResponse 등)
```

## 주요 기능

### 1. 인증 및 사용자 관리
- 회원가입 / 로그인 (JWT 기반)
- 사용자 정보 조회 및 수정
- 권한 관리 (ADMIN, STAFF)
- 팀원의 오늘 업무 조회

### 2. 프로젝트 관리
- 프로젝트 생성, 조회, 수정, 삭제
- 프로젝트 참여자 할당
- 기간별 프로젝트 조회 (캘린더용)
- 프로젝트별 일정 및 파일 연동

### 3. 일정 관리
- 일정 생성, 조회, 수정, 삭제
- 내 업무 조회 (기간별)
- 기간별 일정 조회 (캘린더용)
- 프로젝트 일정 / 시운전 일정 구분

### 4. 거래처 관리
- 거래처 정보 관리 (발주처, 부품 구매처)
- 담당자 연락처 관리

### 5. 파일 관리
- 파일 업로드 / 다운로드
- 카테고리별 분류 (견적서, 회로도, PLC 프로그램, BOM, HMI 작화)
- 프로젝트별 파일 연동

## 설치 및 실행

### 요구사항

- Java 21+
- MySQL 8.0+
- Gradle 8.0+

### 1. 데이터베이스 설정

```sql
CREATE DATABASE scheduleflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. 환경 변수 설정

`.env` 파일을 프로젝트 루트에 생성하고 다음 내용을 입력합니다.

```properties
MYSQL_USER=your_username
MYSQL_PASSWORD=your_password
JWT_SECRET=your-256-bit-secret-key-here
JWT_EXPIRATION=86400000
```

### 3. 애플리케이션 실행

```bash
# 프로젝트 루트에서 실행
cd backend
./gradlew bootRun
```

서버는 `http://localhost:8080/api`에서 실행됩니다.

### 4. 빌드

```bash
./gradlew clean build
```

빌드된 JAR 파일은 `build/libs/` 디렉토리에 생성됩니다.

## Docker 실행

프로젝트 루트에서 `docker-compose`를 사용하여 전체 스택을 실행할 수 있습니다.

```bash
# 프로젝트 루트에서 실행
docker-compose up -d
```

## API 개요

### Base URL
```
http://localhost:8080/api
```

### Swagger UI
애플리케이션 실행 후 다음 URL에서 API 문서를 확인할 수 있습니다.

```
http://localhost:8080/api/swagger-ui/index.html
```

### 주요 엔드포인트

#### 인증
- `POST /auth/sign-up` - 회원가입
- `POST /auth/sign-in` - 로그인

#### 사용자
- `GET /users` - 사용자 목록 조회 (페이징, 검색)
- `GET /users/{userId}` - 사용자 상세 조회
- `PATCH /users/{userId}` - 사용자 정보 수정
- `DELETE /users/{userId}` - 사용자 삭제 (관리자 전용)
- `GET /users/team-tasks` - 팀원 오늘 업무 조회

#### 프로젝트
- `GET /projects` - 프로젝트 목록 조회 (페이징, 검색)
- `GET /projects/{projectId}` - 프로젝트 상세 조회
- `POST /projects` - 프로젝트 생성 (관리자 전용)
- `PATCH /projects/{projectId}` - 프로젝트 수정 (관리자 전용)
- `DELETE /projects/{projectId}` - 프로젝트 삭제 (관리자 전용)
- `GET /projects/period` - 기간별 프로젝트 조회
- `GET /projects/period/with-schedules` - 기간별 프로젝트 + 일정 조회

#### 일정
- `GET /schedules` - 일정 목록 조회 (페이징, 검색)
- `GET /schedules/{scheduleId}` - 일정 상세 조회
- `POST /schedules` - 일정 생성 (관리자 전용)
- `PATCH /schedules/{scheduleId}` - 일정 수정 (관리자 전용)
- `DELETE /schedules/{scheduleId}` - 일정 삭제 (관리자 전용)
- `GET /schedules/period` - 기간별 일정 조회
- `GET /schedules/my-tasks` - 내 업무 조회

#### 거래처
- `GET /partners` - 거래처 목록 조회 (페이징, 검색)
- `GET /partners/{partnerId}` - 거래처 상세 조회
- `POST /partners` - 거래처 생성 (관리자 전용)
- `PATCH /partners/{partnerId}` - 거래처 수정 (관리자 전용)
- `DELETE /partners/{partnerId}` - 거래처 삭제 (관리자 전용)

#### 파일
- `POST /files/upload` - 파일 업로드
- `GET /files/download/{fileId}` - 파일 다운로드
- `GET /files` - 파일 목록 조회
- `DELETE /files/{fileId}` - 파일 삭제

### 인증 방식

모든 API는 JWT 토큰 기반 인증을 사용합니다 (인증 엔드포인트 제외).

```http
Authorization: Bearer {jwt_token}
```

### 권한
- **ADMIN**: 모든 데이터의 생성, 수정, 삭제 가능
- **STAFF**: 조회만 가능, 자신의 정보는 수정 가능

## 환경 설정

### application.yml

```yaml
server:
  port: 8080
  servlet:
    context-path: /api

spring:
  datasource:
    url: jdbc:mysql://localhost:3306/scheduleflow?serverTimezone=Asia/Seoul&characterEncoding=UTF-8
    username: ${MYSQL_USER}
    password: ${MYSQL_PASSWORD}
    driver-class-name: com.mysql.cj.jdbc.Driver

  servlet:
    multipart:
      max-file-size: 1GB
      max-request-size: 1GB

  jpa:
    show-sql: true
    open-in-view: false
    generate-ddl: true
    hibernate:
      ddl-auto: update
    properties:
      hibernate:
        format_sql: true
        default_batch_fetch_size: 50

jwt:
  secret-key: ${JWT_SECRET}
  expiration: ${JWT_EXPIRATION}

storage:
  path: C:\ScheduleFlow
```

### 주요 설정 항목

- **server.port**: API 서버 포트 (기본: 8080)
- **server.servlet.context-path**: API 기본 경로 (/api)
- **spring.jpa.hibernate.ddl-auto**: 데이터베이스 스키마 자동 관리 (개발: update, 운영: validate 권장)
- **jwt.expiration**: JWT 토큰 만료 시간 (밀리초, 기본: 24시간)
- **storage.path**: 파일 업로드 저장 경로

## 테스트

```bash
# 모든 테스트 실행
./gradlew test

# 특정 테스트 실행
./gradlew test --tests "org.core.scheduleflow.domain.user.*"
```
