# 목록 페이지 페이징 API 스펙 정의

## 개요

Sidebar의 대시보드를 제외한 5개 메뉴(프로젝트, 파일, 일정, 거래처, 사원)에 대한 목록 조회 API 스펙을 정의합니다. 각 API는 검색 기능과 페이징(page/size 방식)을 포함합니다.

## 공통 페이징 응답 구조

모든 목록 API는 공통 페이징 응답 구조를 사용합니다:

```kotlin
data class PageResponse<T>(
    val content: List<T>,           // 실제 데이터 목록
    val totalElements: Long,        // 전체 데이터 개수
    val totalPages: Int,            // 전체 페이지 수
    val currentPage: Int,           // 현재 페이지 (0부터 시작)
    val pageSize: Int,              // 페이지 크기
    val hasNext: Boolean,           // 다음 페이지 존재 여부
    val hasPrevious: Boolean        // 이전 페이지 존재 여부
)
```

## 1. 프로젝트 목록 API

### 엔드포인트
`GET /projects`

### 요청 파라미터
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `query` | String | 선택 | 프로젝트 이름 검색어 |
| `page` | Int | 선택 | 페이지 번호 (0부터 시작, 기본값: 0) |
| `size` | Int | 선택 | 페이지 크기 (기본값: 5) |

### 응답 구조
```kotlin
data class ProjectListResponse(
    val id: Long,
    val name: String,                    // 프로젝트 이름
    val clientName: String,              // 거래처 이름
    val status: String,                  // 상태 (IN_PROGRESS, ON_HOLD, COMPLETE)
    val startDate: String,               // 시작일 (yyyy-MM-dd)
    val endDate: String,                // 종료일 (yyyy-MM-dd)
    val colorCode: String?               // 색상 코드
)
```

### 예시 요청
```
GET /projects?query=PLC&page=0&size=5
```

### 예시 응답
```json
{
  "content": [
    {
      "id": 1,
      "name": "PLC 제어 시스템",
      "clientName": "ABC 기업",
      "status": "IN_PROGRESS",
      "startDate": "2024-01-01",
      "endDate": "2024-12-31",
      "colorCode": "#3b82f6"
    },
    {
      "id": 2,
      "name": "하드웨어 설계",
      "clientName": "XYZ 회사",
      "status": "COMPLETE",
      "startDate": "2023-06-01",
      "endDate": "2023-12-31",
      "colorCode": "#10b981"
    }
  ],
  "totalElements": 12,
  "totalPages": 3,
  "currentPage": 0,
  "pageSize": 5,
  "hasNext": true,
  "hasPrevious": false
}
```

## 2. 파일 목록 API

### 엔드포인트
`GET /files`

### 요청 파라미터
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `query` | String | 선택 | 파일명 검색어 |
| `page` | Int | 선택 | 페이지 번호 (0부터 시작, 기본값: 0) |
| `size` | Int | 선택 | 페이지 크기 (기본값: 5) |

### 응답 구조
```kotlin
data class FileListResponse(
    val id: Long,
    val originalFileName: String,        // 원본 파일명
    val projectName: String?,            // 프로젝트 이름 (null 가능)
    val uploaderName: String,            // 업로더 이름
    val category: String,                // 파일 카테고리
    val fileSize: Long,                  // 파일 크기 (bytes)
    val contentType: String,             // MIME 타입
    val createdAt: String                // 업로드 일시 (yyyy-MM-dd HH:mm:ss)
)
```

### 예시 요청
```
GET /files?query=설계도&page=0&size=5
```

### 예시 응답
```json
{
  "content": [
    {
      "id": 1,
      "originalFileName": "설계도면.pdf",
      "projectName": "PLC 제어 시스템",
      "uploaderName": "홍길동",
      "category": "DESIGN",
      "fileSize": 1024000,
      "contentType": "application/pdf",
      "createdAt": "2024-01-15 14:30:00"
    }
  ],
  "totalElements": 8,
  "totalPages": 2,
  "currentPage": 0,
  "pageSize": 5,
  "hasNext": true,
  "hasPrevious": false
}
```

## 3. 일정 목록 API

### 엔드포인트
`GET /schedules`

### 요청 파라미터
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `query` | String | 선택 | 일정 제목 검색어 |
| `page` | Int | 선택 | 페이지 번호 (0부터 시작, 기본값: 0) |
| `size` | Int | 선택 | 페이지 크기 (기본값: 5) |

### 응답 구조
```kotlin
data class ScheduleListResponse(
    val id: Long,
    val title: String,                   // 일정 제목
    val projectName: String?,            // 프로젝트 이름 (null 가능)
    val type: String,                    // 일정 타입 (PROJECT, TEST_RUN, WIRING, DESIGN, MEETING)
    val startDate: String,               // 시작일 (yyyy-MM-dd)
    val endDate: String,                // 종료일 (yyyy-MM-dd)
    val memberNames: List<String>        // 참여자 이름 목록
)
```

### 예시 요청
```
GET /schedules?query=미팅&page=0&size=5
```

### 예시 응답
```json
{
  "content": [
    {
      "id": 1,
      "title": "클라이언트 미팅",
      "projectName": "PLC 제어 시스템",
      "type": "MEETING",
      "startDate": "2024-01-20",
      "endDate": "2024-01-20",
      "memberNames": ["홍길동", "김철수"]
    }
  ],
  "totalElements": 15,
  "totalPages": 3,
  "currentPage": 0,
  "pageSize": 5,
  "hasNext": true,
  "hasPrevious": false
}
```

## 4. 거래처 목록 API

### 엔드포인트
`GET /partners`

### 요청 파라미터
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `query` | String | 선택 | 회사명 검색어 |
| `page` | Int | 선택 | 페이지 번호 (0부터 시작, 기본값: 0) |
| `size` | Int | 선택 | 페이지 크기 (기본값: 5) |

### 응답 구조
```kotlin
data class PartnerListResponse(
    val id: Long,
    val companyName: String,             // 회사명
    val mainPhone: String?,              // 대표 전화번호
    val address: String?                 // 주소
)
```

### 예시 요청
```
GET /partners?query=ABC&page=0&size=5
```

### 예시 응답
```json
{
  "content": [
    {
      "id": 1,
      "companyName": "ABC 기업",
      "mainPhone": "02-1234-5678",
      "address": "서울시 강남구"
    },
    {
      "id": 2,
      "companyName": "XYZ 회사",
      "mainPhone": "02-9876-5432",
      "address": "서울시 서초구"
    }
  ],
  "totalElements": 10,
  "totalPages": 2,
  "currentPage": 0,
  "pageSize": 5,
  "hasNext": true,
  "hasPrevious": false
}
```

## 5. 사원 목록 API (ADMIN 전용)

### 엔드포인트
`GET /admin/users`

### 요청 파라미터
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `query` | String | 선택 | 사원 이름 검색어 |
| `page` | Int | 선택 | 페이지 번호 (0부터 시작, 기본값: 0) |
| `size` | Int | 선택 | 페이지 크기 (기본값: 5) |

### 응답 구조
```kotlin
data class UserListResponse(
    val id: Long,
    val name: String,                    // 사원 이름
    val username: String,                // 사용자명
    val email: String?,                 // 이메일
    val phone: String,                  // 전화번호
    val position: String?,              // 직책
    val role: String                    // 권한 (ADMIN, STAFF)
)
```

### 예시 요청
```
GET /admin/users?query=홍길동&page=0&size=5
```

### 예시 응답
```json
{
  "content": [
    {
      "id": 1,
      "name": "홍길동",
      "username": "hong",
      "email": "hong@example.com",
      "phone": "010-1234-5678",
      "position": "시니어 개발자",
      "role": "STAFF"
    },
    {
      "id": 2,
      "name": "김철수",
      "username": "kim",
      "email": "kim@example.com",
      "phone": "010-9876-5432",
      "position": "주니어 개발자",
      "role": "STAFF"
    }
  ],
  "totalElements": 7,
  "totalPages": 2,
  "currentPage": 0,
  "pageSize": 5,
  "hasNext": true,
  "hasPrevious": false
}
```

## 페이징 동작 방식

- **페이지 번호**: 0부터 시작 (첫 페이지 = 0)
- **페이지 크기**: 기본값 5, 변경 가능
- **화살표 이동**: 
  - 왼쪽 화살표: `page - 1` (이전 페이지)
  - 오른쪽 화살표: `page + 1` (다음 페이지)
  - 각 페이지는 5개 항목 표시

## 검색 동작 방식

- **검색 필드**: 각 목록의 주요 이름/제목 필드만 검색
  - 프로젝트: `name` 필드
  - 파일: `originalFileName` 필드
  - 일정: `title` 필드
  - 거래처: `companyName` 필드
  - 사원: `name` 필드
- **검색어가 없으면**: 전체 목록 반환
- **검색어가 있으면**: 해당 필드에 검색어가 포함된 항목만 반환 (LIKE 검색)

## 구현 참고사항

1. **공통 페이징 응답 클래스**: `PageResponse<T>`를 공통 DTO로 생성하여 재사용
2. **Spring Data JPA Pageable**: `Pageable` 인터페이스 활용 권장
3. **검색 쿼리**: `@Query` 어노테이션 또는 Specification을 사용하여 동적 쿼리 구성
4. **정렬**: 기본 정렬은 최신순(생성일시 내림차순) 권장

