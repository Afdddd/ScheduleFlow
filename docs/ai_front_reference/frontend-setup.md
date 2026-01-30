# 프론트엔드 개발 환경 설정 가이드

## Issue #1

### 1. 환경 변수 설정

#### 작업 내용
- `.env.development.local` 파일 생성
- `REACT_APP_API_BASE_URL=http://localhost:8080` 설정

#### 파일 위치
```
frontend/.env.development.local
```

#### 왜 `.env.development.local`을 사용할까요?

1. **React 환경 변수 규칙**
   - React는 `REACT_APP_` 접두사가 붙은 환경 변수만 클라이언트 코드에서 접근 가능
   - 빌드 시점에 코드에 주입되므로, 브라우저 콘솔에서 직접 `process.env` 접근 불가

2. **파일명의 의미**
   - `.env.development.local`: 개발 환경 전용, 로컬에서만 사용
   - `.local` 접미사: Git에 커밋되지 않음 (개인 설정용)
   - `npm start` 실행 시 자동으로 로드됨

3. **환경 변수 확인 방법**
   - 브라우저 콘솔에서 직접 확인 불가 (Node.js 런타임 객체이므로)
   - React 컴포넌트 내에서 `process.env.REACT_APP_*` 형태로 접근 가능
   - 현재 `App.tsx`에 임시 확인 코드 추가됨

#### 확인 방법
```tsx
// App.tsx에서 확인 (임시 코드)
{process.env.REACT_APP_API_BASE_URL || 'Not set'}
```

---

### 2. 백엔드 CORS 설정 확인


#### 설정 위치
`backend/src/main/kotlin/org/core/scheduleflow/global/config/SecurityConfig.kt`

```kotlin
@Bean
fun corsConfigurationSource(): CorsConfigurationSource {
    val configuration = CorsConfiguration()
    configuration.allowedOriginPatterns = mutableListOf("http://localhost:*")
    configuration.allowedHeaders = listOf("Authorization", "Content-Type")
    configuration.allowedMethods = listOf("GET", "POST", "PUT", "DELETE", "OPTIONS")
    configuration.allowCredentials = true
    // ...
}
```

#### 왜 CORS 설정이 필요한가요?

1. **브라우저 보안 정책**
   - 브라우저는 다른 출처(origin)로의 요청을 기본적으로 차단
   - 프론트엔드(`localhost:3000`) → 백엔드(`localhost:8080`)는 다른 출처

2. **현재 설정의 의미**
   - `allowedOriginPatterns = ["http://localhost:*"]`: 모든 localhost 포트 허용
   - `allowCredentials = true`: 쿠키/인증 정보 포함 가능
   - `allowedHeaders`: Authorization 헤더 허용 (JWT 토큰 전송용)

---

### 3. 개발 서버 실행 확인

#### 실행 방법
```bash
cd frontend
npm start
```

#### 확인 사항
- ✅ 개발 서버가 `http://localhost:3000`에서 실행됨
- ✅ 브라우저에서 React 앱이 정상적으로 표시됨
- ✅ Hot Reload 동작 (코드 수정 시 자동 새로고침)

---

## 현재 상태

### 완료된 항목
- [x] `.env.development.local` 파일 생성
- [x] 백엔드 CORS 설정 확인
- [x] 개발 서버 정상 실행 확인
- [x] 환경 변수 로드 확인 (임시 코드로 확인)

---

## Issue #2

### 1. axios 설치

#### 작업 내용
- `npm install axios` 실행
- HTTP 클라이언트 라이브러리 설치 완료

#### 설치 확인
```bash
cd frontend
npm list axios
```

---

### 2. API 폴더 구조 생성

#### 생성된 파일 구조
```
frontend/src/api/
├── client.ts    # axios 인스턴스 및 인터셉터 설정
└── types.ts     # API 응답 타입 정의
```

---

### 3. API 클라이언트 설정 (`src/api/client.ts`)

#### 주요 기능

1. **axios 인스턴스 생성**
   ```typescript
   const apiClient = axios.create({
     baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080',
     headers: { 'Content-Type': 'application/json' }
   });
   ```
   - 환경 변수에서 baseURL 자동 로드
   - 기본 헤더 설정

2. **JWT 토큰 관리 함수**
   - `setAuthToken(token)`: localStorage에 토큰 저장
   - `getAuthToken()`: localStorage에서 토큰 조회
   - `removeAuthToken()`: localStorage에서 토큰 삭제

3. **요청 인터셉터**
   - 모든 요청에 JWT 토큰 자동 첨부
   - `Authorization: Bearer {token}` 형식으로 헤더 추가
   - 토큰이 없으면 헤더에 추가하지 않음

4. **응답 인터셉터**
   - 401 에러 시 자동으로 토큰 삭제 및 로그인 페이지로 리다이렉트
   - 에러 응답을 컴포넌트에서 처리할 수 있도록 반환

#### 왜 이렇게 설계했을까요?

1. **localStorage 사용 이유**
   - 페이지 새로고침 후에도 로그인 상태 유지
   - 사용자 편의성 향상 (자동 로그인)
   - ⚠️ 보안 고려: XSS 취약점이 있으면 토큰 탈취 가능 (향후 httpOnly 쿠키로 전환 검토)

2. **인터셉터 패턴 사용 이유**
   - 매 요청마다 토큰을 수동으로 넣지 않아도 됨
   - 중앙 집중식 에러 처리
   - 코드 중복 제거

3. **401 에러 처리**
   - 토큰 만료/무효 시 자동 로그아웃
   - 사용자 경험 개선 (명확한 피드백)

---

### 4. API 타입 정의 (`src/api/types.ts`)

#### 정의된 타입

1. **ErrorResponse**
   ```typescript
   interface ErrorResponse {
     timestamp: string;
     status: number;
     message: string;
     path: string;
   }
   ```
   - 백엔드의 `ErrorResponse`와 일치하도록 작성
   - 타입 안정성 확보

2. **ApiResponse<T>**
   - 성공/실패 공통 응답 래퍼 타입
   - 제네릭을 사용하여 다양한 응답 타입 지원

---

### 5. 테스트 코드 작성 및 검증

#### 테스트 시나리오
1. ✅ 로그인 API 호출 테스트 (`/auth/sign-in`)
2. ✅ 토큰 저장 확인 (localStorage)
3. ✅ 인증 필요한 API 호출 테스트 (`/projects`)
4. ✅ 토큰 삭제 테스트

#### 테스트 결과
- ✅ 모든 테스트 통과
- ✅ JWT 토큰 자동 첨부 확인
- ✅ 에러 처리 정상 동작

---

## 현재 상태

### 완료된 항목
- [x] `.env.development.local` 파일 생성
- [x] 백엔드 CORS 설정 확인
- [x] 개발 서버 정상 실행 확인
- [x] 환경 변수 로드 확인
- [x] axios 설치
- [x] `src/api/` 폴더 구조 생성
- [x] API 클라이언트 설정 (JWT 토큰 자동 첨부)
- [x] 에러 처리 인터셉터 구현
- [x] API 타입 정의
- [x] 테스트 코드 작성 및 검증

### 다음 단계 (Issue #3)
- [ ] react-router-dom 설치
- [ ] `src/App.tsx`에 Router 설정
- [ ] 기본 라우트 구성
- [ ] 보호된 라우트 컴포넌트 생성
- [ ] 404 페이지 생성

---

## 사용 방법

### API 클라이언트 사용 예시

```typescript
import apiClient from './api/client';
import { setAuthToken } from './api/client';

// 로그인
const response = await apiClient.post('/auth/sign-in', {
  username: 'admin',
  password: 'password123'
});
setAuthToken(response.data); // 토큰 저장

// 인증 필요한 API 호출 (토큰 자동 첨부)
const projects = await apiClient.get('/projects');

// 에러 처리
try {
  await apiClient.get('/projects');
} catch (error) {
  if (error.response?.status === 401) {
    // 401 에러는 인터셉터에서 자동 처리됨
  } else {
    // 다른 에러는 컴포넌트에서 처리
    console.error(error.response?.data?.message);
  }
}
```

---

## 주의사항

### 환경 변수 관련
1. **브라우저 콘솔에서 직접 확인 불가**
   - `process`는 Node.js 런타임 객체
   - React 컴포넌트 내부에서만 접근 가능

2. **환경 변수 변경 시**
   - 개발 서버 재시작 필요
   - `.env.development.local` 파일 수정 후 `npm start` 다시 실행

### 백엔드 서버
- API 클라이언트 테스트를 위해 백엔드 서버 실행 필요
- `http://localhost:8080`에서 응답해야 함

### API 클라이언트 사용 시
1. **토큰 관리**
   - 로그인 성공 시 `setAuthToken()` 호출 필수
   - 로그아웃 시 `removeAuthToken()` 호출

2. **에러 처리**
   - 401 에러는 인터셉터에서 자동 처리
   - 다른 에러는 컴포넌트에서 try-catch로 처리

3. **리다이렉트**
   - 인터셉터는 컴포넌트 외부에서 실행되므로 `window.location.href` 사용
   - React Router가 설정되어 있으면 자동으로 라우팅 처리됨

---

## Issue #3

### 1. react-router-dom 설치

#### 작업 내용
- `npm install react-router-dom` 실행
- React Router 라이브러리 설치 완료

---

### 2. JWT 토큰 유틸리티 생성 (`src/utils/jwt.ts`)

#### 주요 기능

1. **JWT 토큰 디코딩**
   ```typescript
   decodeJwtPayload(token: string): JwtPayload | null
   ```
   - JWT 토큰의 payload 부분만 디코딩 (서명 검증 없음)
   - Base64 URL 디코딩 수행
   - 프론트엔드에서는 UI 표시 목적으로만 사용

2. **인증 상태 확인 함수**
   - `getCurrentUserRole()`: 현재 사용자의 role 조회
   - `isAdmin()`: ADMIN 권한 여부 확인
   - `isAuthenticated()`: 인증 여부 확인

#### 왜 payload만 디코딩할까요?

1. **보안 고려사항**
   - 프론트엔드에 JWT secret key를 노출하면 안 됨
   - 서명 검증은 백엔드에서 수행
   - 프론트엔드는 UI 표시 목적으로만 사용

2. **실제 권한 체크**
   - 프론트엔드의 role 체크는 UI 표시용
   - 실제 권한 체크는 백엔드 API에서 수행
   - 프론트엔드 체크는 우회 가능하므로 보안 목적으로 사용 불가

---

### 3. 보호된 라우트 컴포넌트 생성 (`src/components/ProtectedRoute.tsx`)

#### 주요 기능

1. **인증 체크**
   - 인증되지 않은 사용자는 `/login`으로 리다이렉트

2. **권한 체크**
   - `requireAdmin` prop이 true인 경우 ADMIN 권한 체크
   - ADMIN이 아니면 홈(`/`)으로 리다이렉트

#### 사용 예시

```tsx
// 일반 보호된 라우트
<ProtectedRoute>
  <DashboardPage />
</ProtectedRoute>

// ADMIN 권한 필요한 라우트
<ProtectedRoute requireAdmin>
  <UserManagementPage />
</ProtectedRoute>
```

#### 왜 이 패턴을 사용할까요?

1. **재사용성**
   - 모든 보호된 라우트에 동일한 로직 적용
   - 코드 중복 제거

2. **유지보수성**
   - 인증/권한 로직 변경 시 한 곳만 수정
   - 테스트 용이

---

### 4. 기본 페이지 컴포넌트 생성

#### 생성된 페이지

1. **공개 페이지**
   - `LoginPage.tsx` - 로그인 페이지 (플레이스홀더)
   - `SignUpPage.tsx` - 회원가입 페이지 (플레이스홀더)

2. **보호된 페이지**
   - `DashboardPage.tsx` - 대시보드 (플레이스홀더)
   - `ProjectListPage.tsx` - 프로젝트 목록 (플레이스홀더)
   - `ProjectDetailPage.tsx` - 프로젝트 상세 (플레이스홀더)
   - `PartnerListPage.tsx` - 거래처 목록 (플레이스홀더)

3. **ADMIN 전용 페이지**
   - `UserManagementPage.tsx` - 사원 관리 (플레이스홀더)

4. **기타**
   - `NotFoundPage.tsx` - 404 페이지

#### 현재 상태
- 모든 페이지는 플레이스홀더 상태
- 각 Issue에서 실제 구현 예정

---

### 5. 라우터 설정 (`src/App.tsx`)

#### 라우트 구성

```tsx
<BrowserRouter>
  <Routes>
    {/* 공개 라우트 */}
    <Route path="/login" element={<LoginPage />} />
    <Route path="/signup" element={<SignUpPage />} />

    {/* 보호된 라우트 */}
    <Route path="/" element={
      <ProtectedRoute><DashboardPage /></ProtectedRoute>
    } />
    <Route path="/projects" element={
      <ProtectedRoute><ProjectListPage /></ProtectedRoute>
    } />
    <Route path="/projects/:id" element={
      <ProtectedRoute><ProjectDetailPage /></ProtectedRoute>
    } />
    <Route path="/partners" element={
      <ProtectedRoute><PartnerListPage /></ProtectedRoute>
    } />

    {/* ADMIN 권한 필요한 라우트 */}
    <Route path="/admin/users" element={
      <ProtectedRoute requireAdmin>
        <UserManagementPage />
      </ProtectedRoute>
    } />

    {/* 404 페이지 */}
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
</BrowserRouter>
```

#### 라우트 구조

1. **공개 라우트**
   - `/login` - 로그인 페이지
   - `/signup` - 회원가입 페이지

2. **보호된 라우트** (인증 필요)
   - `/` - 대시보드
   - `/projects` - 프로젝트 목록
   - `/projects/:id` - 프로젝트 상세
   - `/partners` - 거래처 목록

3. **ADMIN 전용 라우트**
   - `/admin/users` - 사원 관리

4. **404 페이지**
   - 존재하지 않는 경로 접근 시 표시

---

## Issue #4

### 1. Zustand 설치

#### 작업 내용
- `npm install zustand` 실행
- 상태 관리 라이브러리 설치 완료

#### 왜 Zustand를 선택했을까요?

1. **간단함**
   - Context API보다 보일러플레이트가 적음
   - 빠르게 구현 가능

2. **성능**
   - 선택적 리렌더링 (필요한 상태만 구독)
   - 불필요한 리렌더링 방지

3. **TypeScript 지원**
   - 완벽한 타입 추론
   - 타입 안정성 확보

4. **경량**
   - 번들 크기가 작음
   - 빠른 런타임 성능

---

### 2. 인증 상태 스토어 생성 (`src/stores/authStore.ts`)

#### 주요 기능

1. **상태 관리**
   - `isAuthenticated`: 로그인 상태 (boolean)
   - `user`: 현재 사용자 정보 (User | null)
     - `id`: 사용자 ID
     - `username`: 사용자명
     - `role`: 권한 (ADMIN, STAFF)
   - `token`: JWT 토큰 (string | null)

2. **액션 함수**
   - `login(token: string)`: 로그인 시 토큰 저장 및 상태 업데이트
   - `logout()`: 로그아웃 시 상태 초기화
   - `initialize()`: 페이지 로드 시 localStorage에서 토큰 복원

3. **persist 미들웨어**
   - localStorage와 자동 동기화
   - 페이지 새로고침 시에도 상태 유지
   - `isAuthenticated`와 `user`만 persist (token은 별도 관리)

#### 사용자 정보 추출

```typescript
const extractUserFromToken = (token: string): User | null
```

- JWT 토큰의 payload에서 사용자 정보 추출
- `userId`, `username` (sub), `role` 정보 파싱

#### 왜 persist 미들웨어를 사용할까요?

1. **자동 동기화**
   - localStorage와 자동으로 동기화
   - 수동으로 저장/복원 로직 작성 불필요

2. **상태 복원**
   - 페이지 새로고침 시 자동으로 상태 복원
   - 사용자 경험 개선 (자동 로그인 유지)

3. **선택적 저장**
   - `partialize`로 필요한 상태만 저장
   - token은 `api/client.ts`에서 별도 관리

---

### 3. 컴포넌트 통합

#### App.tsx 수정

```tsx
const initialize = useAuthStore((state) => state.initialize);

useEffect(() => {
  initialize(); // 앱 시작 시 인증 상태 초기화
}, [initialize]);
```

- 앱 시작 시 localStorage에서 토큰 복원
- 인증 상태 자동 복원

#### ProtectedRoute 수정

```tsx
const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
const user = useAuthStore((state) => state.user);
```

- 기존의 함수 호출 방식 (`isAuthenticated()`)에서 상태 구독 방식으로 변경
- 리액티브하게 인증 상태 감지
- 상태 변경 시 자동 리렌더링

#### LoginPage 수정

```tsx
const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

useEffect(() => {
  if (isAuthenticated) {
    navigate('/', { replace: true });
  }
}, [isAuthenticated, navigate]);
```

- 리액티브하게 인증 상태 확인
- 상태 변경 시 자동 리다이렉트

#### auth.ts 수정

```tsx
export const signIn = async (request: SignInRequest): Promise<string> => {
  const response = await apiClient.post<string>('/auth/sign-in', request);
  const token = response.data;
  
  // authStore를 통해 상태 업데이트
  useAuthStore.getState().login(token);
  
  return token;
};
```

- 로그인 성공 시 authStore의 `login()` 호출
- 상태 자동 업데이트 및 localStorage 동기화

---

### 4. 사용 방법

#### 기본 사용

```tsx
import { useAuthStore } from '../stores/authStore';

function MyComponent() {
  const { isAuthenticated, user, login, logout } = useAuthStore();
  
  // 상태 사용
  if (isAuthenticated) {
    return <div>안녕하세요, {user?.username}님</div>;
  }
  
  return <div>로그인이 필요합니다.</div>;
}
```

#### 성능 최적화 (선택적 구독)

```tsx
// 필요한 상태만 구독 (불필요한 리렌더링 방지)
const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
const user = useAuthStore((state) => state.user);

// 액션만 구독 (상태 변경 시 리렌더링 안 됨)
const login = useAuthStore((state) => state.login);
const logout = useAuthStore((state) => state.logout);
```

#### 컴포넌트 외부에서 사용

```tsx
// auth.ts에서처럼 컴포넌트 외부에서 사용
import { useAuthStore } from '../stores/authStore';

const logout = () => {
  useAuthStore.getState().logout();
};
```

---

## Issue #5

### 1. 로그인 API 함수 생성 (`src/api/auth.ts`)

#### 주요 기능

1. **signIn 함수**
   ```typescript
   export const signIn = async (request: SignInRequest): Promise<string>
   ```
   - 로그인 API 호출 (`POST /auth/sign-in`)
   - 로그인 성공 시 authStore의 `login()` 호출하여 상태 업데이트
   - JWT 토큰 반환

#### 요청/응답 형식

- **Request**: `{ username: string, password: string }`
- **Response**: `string` (JWT 토큰)

#### 왜 authStore를 직접 호출할까요?

- `signIn` 함수는 컴포넌트 외부에서도 호출 가능해야 함
- `useAuthStore()` hook은 컴포넌트 내부에서만 사용 가능
- `useAuthStore.getState()`로 스토어 인스턴스에 직접 접근

---

### 2. 로그인 페이지 구현 (`src/pages/LoginPage.tsx`)

#### 주요 기능

1. **로그인 폼 UI**
   - 사용자명 입력 필드
   - 비밀번호 입력 필드 (type="password")
   - 로그인 버튼
   - 회원가입 링크

2. **폼 Validation**
   - 사용자명 필수 체크
   - 비밀번호 필수 체크
   - 실시간 validation 에러 표시

3. **에러 처리**
   - API 에러 메시지 표시
   - 네트워크 에러 처리
   - 사용자가 읽을 수 있도록 에러 메시지 유지

4. **인증 상태 체크**
   - 이미 로그인한 사용자는 대시보드로 자동 리다이렉트
   - authStore의 `isAuthenticated` 상태를 리액티브하게 구독

#### 에러 메시지 관리 전략

1. **에러 메시지 표시**
   - 로그인 실패 시 서버 에러 메시지 표시
   - 에러 메시지에 닫기 버튼(×) 제공

2. **에러 메시지 제거 시점**
   - **자동 제거**: 다음 로그인 시도 시 (validation 통과 후)
   - **수동 제거**: 사용자가 × 버튼 클릭
   - **유지**: 사용자가 입력하는 동안은 유지 (읽을 시간 제공)

#### 왜 이렇게 설계했을까요?

1. **에러 메시지 유지**
   - 사용자가 에러 메시지를 읽을 수 있도록 충분한 시간 제공
   - 입력 시 즉시 사라지지 않도록 설계

2. **자동 리다이렉트**
   - 이미 로그인한 상태에서 `/login` 접근 시 불필요한 로그인 시도 방지
   - UX 개선

3. **Validation 실패 시 API 에러 유지**
   - validation 실패와 API 에러를 구분
   - 사용자가 어떤 에러인지 명확히 알 수 있도록

---

### 3. API 클라이언트 수정 (`src/api/client.ts`)

#### 주요 변경사항

**401 에러 처리 개선:**

```typescript
if (error.response?.status === 401) {
  const requestUrl = error.config?.url || '';
  
  // 로그인 API는 401이 정상적인 응답일 수 있으므로 리다이렉트하지 않음
  if (requestUrl.includes('/auth/sign-in') || requestUrl.includes('/auth/sign-up')) {
    return Promise.reject(error);
  }
  
  // 다른 API의 401 에러는 인증이 필요한 상황이므로 리다이렉트
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}
```

#### 왜 로그인 API는 예외 처리할까요?

1. **정상적인 401 응답**
   - 잘못된 아이디/비밀번호는 401 응답 (정상)
   - 이 경우 리다이렉트하면 에러 메시지를 볼 수 없음

2. **페이지 전환 방지**
   - 로그인 페이지에서 리다이렉트 시 페이지가 새로고침됨
   - 상태가 초기화되어 에러 메시지가 사라짐

3. **컴포넌트에서 처리**
   - 로그인 페이지에서 에러 메시지를 직접 표시
   - 사용자가 에러를 확인하고 재시도 가능

---

## Issue #6

### 1. 회원가입 API 함수 추가 (`src/api/auth.ts`)

#### 주요 기능

1. **signUp 함수**
   ```typescript
   export const signUp = async (request: SignUpRequest): Promise<number>
   ```
   - 회원가입 API 호출 (`POST /auth/sign-up`)
   - 생성된 사용자 ID 반환

#### 요청/응답 형식

- **Request**: `SignUpRequest`
  - `username`: string (필수)
  - `password`: string (필수)
  - `name`: string (필수)
  - `email`: string | undefined (선택)
  - `phone`: string (필수)
- **Response**: `number` (생성된 사용자 ID)

#### SignUpRequest 인터페이스

```typescript
export interface SignUpRequest {
  username: string;
  password: string;
  name: string;
  email?: string;
  phone: string;
}
```

---

### 2. 회원가입 페이지 구현 (`src/pages/SignUpPage.tsx`)

#### 주요 기능

1. **회원가입 폼 UI**
   - 사용자명 입력 필드 (필수)
   - 비밀번호 입력 필드 (필수)
   - 비밀번호 확인 입력 필드 (필수)
   - 이름 입력 필드 (필수)
   - 이메일 입력 필드 (선택)
   - 전화번호 입력 필드 (필수)
   - 회원가입 버튼
   - 로그인 링크

2. **폼 Validation**
   - 필수 필드 체크 (사용자명, 비밀번호, 비밀번호 확인, 이름, 전화번호)
   - 비밀번호 최소 길이 체크 (8자 이상)
   - 비밀번호 일치 확인
   - 이메일 형식 검증 (입력된 경우)
   - 실시간 validation 에러 표시

3. **에러 처리**
   - API 에러 메시지 표시
   - 네트워크 에러 처리
   - 에러 메시지 닫기 버튼 제공
   - 사용자가 읽을 수 있도록 에러 메시지 유지

4. **인증 상태 체크**
   - 이미 로그인한 사용자는 대시보드로 자동 리다이렉트
   - authStore의 `isAuthenticated` 상태를 리액티브하게 구독

5. **회원가입 성공 처리**
   - 성공 시 로그인 페이지로 리다이렉트
   - 사용자가 바로 로그인할 수 있도록

#### Validation 규칙

1. **필수 필드**
   - 사용자명, 비밀번호, 비밀번호 확인, 이름, 전화번호

2. **비밀번호 규칙**
   - 최소 8자 이상
   - 비밀번호와 비밀번호 확인 일치

3. **이메일 (선택)**
   - 입력된 경우에만 형식 검증
   - 정규식: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

#### 왜 이렇게 설계했을까요?

1. **비밀번호 확인 필드**
   - 사용자가 비밀번호를 올바르게 입력했는지 확인
   - 타이핑 실수 방지

2. **이메일 선택 필드**
   - 백엔드에서 optional로 처리
   - 사용자가 입력하지 않아도 회원가입 가능

3. **회원가입 후 로그인 페이지로 리다이렉트**
   - 회원가입과 로그인을 분리
   - 사용자가 명시적으로 로그인하도록 유도

4. **로그인 페이지와 동일한 UX 패턴**
   - 일관된 사용자 경험
   - 유사한 에러 처리 및 validation 로직

---

## Issue #7

### 1. Alert 컴포넌트 구현 (`src/components/Alert.tsx`)

#### 주요 기능

1. **타입별 알럿 지원**
   - `error`: 에러 메시지 (빨간색)
   - `success`: 성공 메시지 (초록색)
   - `warning`: 경고 메시지 (주황색)
   - `info`: 정보 메시지 (파란색)

2. **재사용 가능한 컴포넌트**
   - 일관된 UI/UX 제공
   - 타입 안정성 확보 (TypeScript)
   - 닫기 기능 지원 (선택 가능)

#### 컴포넌트 Props

```typescript
interface AlertProps {
  type: AlertType;              // 'error' | 'success' | 'warning' | 'info'
  message: string;              // 표시할 메시지
  dismissible?: boolean;        // 닫기 버튼 표시 여부 (기본값: true)
  onClose?: () => void;         // 닫기 버튼 클릭 시 호출되는 콜백
  style?: React.CSSProperties;  // 추가 CSS 스타일
}
```

#### 타입별 색상 스키마

- **error**: 배경색 `#fee`, 테두리 `#fcc`, 텍스트 `#c33`
- **success**: 배경색 `#efe`, 테두리 `#cfc`, 텍스트 `#3c3`
- **warning**: 배경색 `#ffa`, 테두리 `#ff8`, 텍스트 `#c90`
- **info**: 배경색 `#eef`, 테두리 `#ccf`, 텍스트 `#33c`

#### 사용 예시

```tsx
// 에러 메시지
<Alert 
  type="error" 
  message="로그인에 실패했습니다." 
  onClose={() => setError('')}
/>

// 성공 메시지
<Alert 
  type="success" 
  message="회원가입이 완료되었습니다." 
  dismissible={false}
/>

// 경고 메시지
<Alert 
  type="warning" 
  message="비밀번호를 변경해주세요." 
  onClose={() => setWarning('')}
/>

// 정보 메시지
<Alert 
  type="info" 
  message="새로운 업데이트가 있습니다." 
  onClose={() => setInfo('')}
/>
```

#### 왜 이렇게 설계했을까요?

1. **타입 시스템 활용**
   - TypeScript의 타입 안정성 확보
   - 허용된 타입만 사용 가능하도록 제한 (`AlertType` union type)
   - 잘못된 타입 사용 시 컴파일 타임에 에러 감지

2. **재사용성**
   - 다양한 상황(에러, 성공, 경고, 정보)에 사용 가능
   - 일관된 UI/UX 제공
   - 코드 중복 제거

3. **유연성**
   - `dismissible` prop으로 닫기 기능 제어
   - `onClose` 콜백으로 부모 컴포넌트에서 상태 관리
   - `style` prop으로 추가 스타일링 가능

4. **접근성**
   - `role="alert"` 속성 추가 (스크린 리더 지원)
   - `aria-label`로 닫기 버튼에 대한 설명 제공

---

### 2. 로그인/회원가입 페이지에 Alert 컴포넌트 적용

#### 변경 사항

**이전 방식 (인라인 스타일):**
```tsx
{apiError && (
  <div style={{ padding: '12px', backgroundColor: '#fee', ... }}>
    <span>{apiError}</span>
    <button onClick={() => setApiError('')}>×</button>
  </div>
)}
```

**개선된 방식 (Alert 컴포넌트 사용):**
```tsx
{apiError && (
  <Alert
    type="error"
    message={apiError}
    onClose={() => setApiError('')}
  />
)}
```

#### 개선 효과

1. **코드 간결성**
   - 인라인 스타일 코드 제거
   - 컴포넌트 재사용으로 코드 중복 제거

2. **유지보수성**
   - 알럿 스타일 변경 시 한 곳만 수정
   - 일관된 디자인 유지

3. **확장성**
   - 성공, 경고, 정보 메시지도 쉽게 추가 가능
   - 다른 페이지에서도 즉시 사용 가능

---

## 현재 상태

### 완료된 항목
- [x] `.env.development.local` 파일 생성
- [x] 백엔드 CORS 설정 확인
- [x] 개발 서버 정상 실행 확인
- [x] 환경 변수 로드 확인
- [x] axios 설치
- [x] `src/api/` 폴더 구조 생성
- [x] API 클라이언트 설정 (JWT 토큰 자동 첨부)
- [x] 에러 처리 인터셉터 구현
- [x] API 타입 정의
- [x] 테스트 코드 작성 및 검증
- [x] react-router-dom 설치
- [x] `src/App.tsx`에 Router 설정
- [x] 기본 라우트 구성
- [x] 보호된 라우트 컴포넌트 생성
- [x] 404 페이지 생성
- [x] JWT 토큰 유틸리티 함수 생성
- [x] Zustand 설치
- [x] 인증 상태 스토어 생성 (authStore.ts)
- [x] 컴포넌트 통합 (App.tsx, ProtectedRoute, LoginPage)
- [x] 전역 인증 상태 관리
- [x] 로그인 API 함수 구현 (`src/api/auth.ts`)
- [x] 로그인 페이지 구현 (`src/pages/LoginPage.tsx`)
- [x] 에러 메시지 관리 로직
- [x] API 클라이언트 401 에러 처리 개선
- [x] 회원가입 API 함수 구현 (`src/api/auth.ts`)
- [x] 회원가입 페이지 구현 (`src/pages/SignUpPage.tsx`)
- [x] Alert 컴포넌트 구현 (`src/components/Alert.tsx`)
- [x] 로그인/회원가입 페이지에 Alert 컴포넌트 적용

### 다음 단계

#### 공통 컴포넌트 개발 계획

**1. Issue #7: 알럿(Alert) 컴포넌트 구현** ✅ 완료
- [x] Alert 컴포넌트 구현
- [x] 로그인/회원가입 페이지에 적용

**2. Issue #8: 대시보드 구현**
- [ ] 헤더 컴포넌트 구현 (대시보드와 함께)
- [ ] 사이드바 컴포넌트 구현 (대시보드와 함께)
- [ ] 대시보드 레이아웃 및 기능 구현

**3. 로딩 스피너**
- [ ] 필요 시 추가 (다른 이슈 진행 중 구현)

#### 왜 이렇게 단계적으로 나눴을까요?

1. **알럿 컴포넌트를 먼저 구현하는 이유**
   - 로그인/회원가입 페이지에서 즉시 활용 가능
   - 에러 메시지 표시의 일관성 확보
   - 다른 기능 개발 전에 공통 UI 패턴 확립

2. **헤더/사이드바를 대시보드와 함께 구현하는 이유**
   - 실제 레이아웃 요구사항을 확인한 후 설계
   - 오버엔지니어링 방지
   - 실제 사용 사례 기반으로 최적화된 컴포넌트 개발

3. **로딩 스피너를 필요 시 추가하는 이유**
   - 많은 곳에서 필요하지만 요구사항이 단순
   - 다른 기능 개발 중 자연스럽게 추가 가능
   - 별도 이슈로 만들 필요성이 낮음

---

## 생성된 파일 구조

```
frontend/src/
├── api/
│   ├── client.ts               # API 클라이언트 (인터셉터 포함)
│   ├── types.ts                # API 타입 정의
│   └── auth.ts                 # 인증 API 함수 (signIn, signUp)
├── components/
│   ├── ProtectedRoute.tsx      # 보호된 라우트 컴포넌트
│   └── Alert.tsx               # Alert 컴포넌트 (에러/성공/경고/정보)
├── pages/
│   ├── LoginPage.tsx           # 로그인 페이지 (구현 완료)
│   ├── SignUpPage.tsx          # 회원가입 페이지 (구현 완료)
│   ├── DashboardPage.tsx       # 대시보드 (플레이스홀더)
│   ├── ProjectListPage.tsx     # 프로젝트 목록 (플레이스홀더)
│   ├── ProjectDetailPage.tsx  # 프로젝트 상세 (플레이스홀더)
│   ├── PartnerListPage.tsx    # 거래처 목록 (플레이스홀더)
│   ├── UserManagementPage.tsx  # 사원 관리 (플레이스홀더)
│   └── NotFoundPage.tsx       # 404 페이지
├── stores/
│   └── authStore.ts            # 인증 상태 관리 스토어 (Zustand)
├── utils/
│   └── jwt.ts                 # JWT 유틸리티 함수
└── App.tsx                     # 라우터 설정 + 인증 상태 초기화
```

---


