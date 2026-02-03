# ScheduleFlow Frontend

10인 미만 PLC 및 하드웨어 전장 설계 회사를 위한 경량 ERP 시스템의 프론트엔드 애플리케이션입니다.

## 기술 스택

- **프레임워크**: React 19.2.3
- **언어**: TypeScript 4.9.5
- **라우팅**: React Router DOM 7.11.0
- **상태 관리**: Zustand 5.0.9
- **HTTP 클라이언트**: Axios 1.13.2
- **스타일링**: Tailwind CSS 3.4.19
- **날짜 처리**: date-fns 4.1.0, react-datepicker 9.1.0
- **빌드 도구**: React Scripts 5.0.1
- **테스트**: React Testing Library, Jest

## 프로젝트 구조

```
frontend/src/
├── App.tsx                    # 애플리케이션 루트 컴포넌트
├── index.tsx                  # 애플리케이션 진입점
├── api/                       # API 클라이언트
│   ├── auth.ts               # 인증 API
│   ├── user.ts               # 사용자 API
│   ├── project.ts            # 프로젝트 API
│   ├── schedule.ts           # 일정 API
│   ├── partner.ts            # 거래처 API
│   └── file.ts               # 파일 API
├── pages/                     # 페이지 컴포넌트
│   ├── DashboardPage.tsx     # 대시보드 (캘린더 + 내 업무)
│   ├── LoginPage.tsx         # 로그인
│   ├── SignUpPage.tsx        # 회원가입
│   ├── ProjectListPage.tsx   # 프로젝트 목록
│   ├── ProjectDetailPage.tsx # 프로젝트 상세
│   ├── ProjectCreatePage.tsx # 프로젝트 생성
│   ├── ScheduleListPage.tsx  # 일정 목록
│   ├── ScheduleDetailPage.tsx# 일정 상세
│   ├── ScheduleCreatePage.tsx# 일정 생성
│   ├── PartnerListPage.tsx   # 거래처 목록
│   ├── PartnerDetailPage.tsx # 거래처 상세
│   ├── PartnerCreatePage.tsx # 거래처 생성
│   ├── FileListPage.tsx      # 파일 관리
│   ├── UserManagementPage.tsx# 사용자 관리
│   └── NotFoundPage.tsx      # 404 페이지
├── components/                # 재사용 가능한 컴포넌트
│   ├── Layout.tsx            # 레이아웃 컨테이너
│   ├── Header.tsx            # 상단 헤더
│   ├── Sidebar.tsx           # 사이드바 네비게이션
│   ├── Calendar.tsx          # 캘린더 컴포넌트
│   ├── MyTasks.tsx           # 내 업무 목록
│   ├── TeamTasks.tsx         # 팀 업무 목록
│   ├── SearchBar.tsx         # 검색 바
│   ├── Pagination.tsx        # 페이지네이션
│   ├── ColorPicker.tsx       # 색상 선택기
│   ├── Alert.tsx             # 알림 컴포넌트
│   └── ProtectedRoute.tsx    # 인증 라우트 가드
├── stores/                    # Zustand 상태 관리
│   └── authStore.ts          # 인증 상태
└── utils/                     # 유틸리티 함수
    └── date.ts               # 날짜 포맷 함수
```

## 주요 기능

### 1. 대시보드
- 전체 프로젝트 캘린더 뷰
- 나에게 할당된 업무 목록 (마감일 임박 순)
- 오늘 팀원들의 업무 현황

### 2. 프로젝트 관리
- 프로젝트 생성, 조회, 수정, 삭제
- 프로젝트별 참여 인원 할당
- 프로젝트 기간 및 상태 관리
- 관련 파일 업로드 및 다운로드
- 프로젝트별 일정 연동

### 3. 일정 관리
- 일정 생성, 조회, 수정, 삭제
- 프로젝트 일정 / 시운전 일정 구분
- 캘린더 뷰로 일정 시각화
- 내 업무 조회

### 4. 거래처 관리
- 거래처 정보 관리
- 담당자 연락처 관리
- 프로젝트별 거래처 연동

### 5. 파일 관리
- 카테고리별 파일 업로드 (견적서, 회로도, PLC 프로그램, BOM, HMI 작화)
- 파일 다운로드
- 프로젝트별 파일 필터링

### 6. 사용자 관리
- 사용자 목록 조회
- 권한 관리 (ADMIN, STAFF)

## 설치 및 실행

### 요구사항

- Node.js 16+
- npm 또는 yarn

### 1. 의존성 설치

```bash
cd frontend
npm install
```

### 2. 환경 변수 설정

`.env.development` 파일을 생성하고 다음 내용을 입력합니다.

```properties
REACT_APP_API_BASE_URL=http://localhost:8080/api
```

운영 환경의 경우 `.env.production` 파일을 생성합니다.

```properties
REACT_APP_API_BASE_URL=https://your-api-domain.com/api
```

### 3. 개발 서버 실행

```bash
npm start
```

애플리케이션은 `http://localhost:3000`에서 실행됩니다.

### 4. 빌드

```bash
npm run build
```

빌드된 파일은 `build/` 디렉토리에 생성됩니다.

## Docker 실행

프로젝트 루트에서 `docker-compose`를 사용하여 전체 스택을 실행할 수 있습니다.

```bash
# 프로젝트 루트에서 실행
docker-compose up -d
```

## 라우팅 구조

```
/ ──────────────────────────── 대시보드 (로그인 필요)
├── /login ──────────────────── 로그인
├── /signup ─────────────────── 회원가입
├── /projects ───────────────── 프로젝트 목록
│   ├── /projects/create ───── 프로젝트 생성 (관리자 전용)
│   └── /projects/:id ──────── 프로젝트 상세
├── /schedules ──────────────── 일정 목록
│   ├── /schedules/create ──── 일정 생성 (관리자 전용)
│   └── /schedules/:id ─────── 일정 상세
├── /partners ───────────────── 거래처 목록
│   ├── /partners/create ───── 거래처 생성 (관리자 전용)
│   └── /partners/:id ──────── 거래처 상세
├── /files ──────────────────── 파일 관리
└── /users ──────────────────── 사용자 관리 (관리자 전용)
```

## 상태 관리

### Zustand Store (authStore)

```typescript
interface AuthState {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}
```

로그인 상태와 사용자 정보를 관리합니다. 토큰은 `localStorage`에 저장됩니다.

## API 연동

모든 API 요청은 Axios를 사용하며, 기본 URL은 환경 변수로 설정됩니다.

### 인증 헤더 자동 설정

```typescript
// api/index.ts
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 에러 처리

API 에러는 interceptor에서 중앙 집중식으로 처리됩니다.

## 스타일링

### Tailwind CSS

유틸리티 퍼스트 CSS 프레임워크를 사용하여 빠르고 일관된 UI를 구현합니다.

### 주요 색상 테마

```css
/* 프로젝트 색상 */
.project-color-1 { background-color: #3b82f6; }  /* 파랑 */
.project-color-2 { background-color: #10b981; }  /* 초록 */
.project-color-3 { background-color: #f59e0b; }  /* 주황 */
.project-color-4 { background-color: #ef4444; }  /* 빨강 */
.project-color-5 { background-color: #8b5cf6; }  /* 보라 */
```

## 테스트

```bash
# 모든 테스트 실행
npm test

# 커버리지 포함
npm test -- --coverage
```

## 빌드 및 배포

### 프로덕션 빌드

```bash
npm run build
```

### 정적 파일 서빙

빌드된 파일은 Nginx 또는 다른 정적 파일 서버를 통해 서빙할 수 있습니다.

```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

## 브라우저 지원

- Chrome (최신 버전)
- Firefox (최신 버전)
- Safari (최신 버전)
- Edge (최신 버전)

## 기여 가이드

1. 컴포넌트는 기능별로 분리합니다
2. 재사용 가능한 컴포넌트는 `components/`에 배치합니다
3. 페이지 컴포넌트는 `pages/`에 배치합니다
4. API 호출 로직은 `api/`에 모듈화합니다
5. TypeScript 타입을 명확히 정의합니다

## 라이선스

<!-- TODO: 라이선스 정보 추가 -->

## 관련 링크

- [프로젝트 기획 문서](https://inyeop.notion.site/ScheduleFlow-2960c52c1219803e8d40d3d313124b9f)
- Backend 저장소: `/backend`
