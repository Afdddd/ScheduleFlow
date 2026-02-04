# 일정 등록 페이지 구현 문서

## 개요

일정 등록 페이지(`ScheduleCreatePage`)는 새로운 일정을 생성하는 페이지입니다. ADMIN 권한이 필요하며, 일정의 기본 정보(제목, 타입, 기간, 프로젝트)와 참여자를 입력받습니다.

## 파일 위치

- `frontend/src/pages/ScheduleCreatePage.tsx`

## 주요 기능

1. **일정 기본 정보 입력**
   - 일정 제목 (필수)
   - 타입 선택 (PROJECT, TEST_RUN, WIRING, DESIGN, MEETING)
   - 기간 선택 (시작일, 종료일 - 필수)
   - 프로젝트 선택 (선택사항)

2. **참여자 선택**
   - 멀티 체크박스로 여러 명 선택 가능
   - 사원 목록 전체 조회

3. **일정 생성**
   - 폼 검증 후 API 호출
   - 성공 시 일정 목록 페이지로 이동

## 상태 관리

### 상태 변수

```typescript
// 기본 정보
const [title, setTitle] = useState<string>('');
const [startDate, setStartDate] = useState<Date | null>(null);
const [endDate, setEndDate] = useState<Date | null>(null);
const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
const [scheduleType, setScheduleType] = useState<string>('PROJECT');
const [projectId, setProjectId] = useState<number | null>(null);

// 참여자
const [users, setUsers] = useState<UserListResponse[]>([]);
const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);

// 프로젝트
const [projects, setProjects] = useState<ProjectListResponse[]>([]);

// 상태
const [loading, setLoading] = useState<boolean>(false);
const [error, setError] = useState<string | null>(null);
const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
const [loadingProjects, setLoadingProjects] = useState<boolean>(false);
```

### 상태 설명

- **title**: 일정 제목
- **startDate/endDate**: 시작일/종료일 (Date 객체)
- **dateRange**: 날짜 범위 선택용 (react-datepicker와 동기화)
- **scheduleType**: 일정 타입 (기본값: PROJECT)
- **projectId**: 선택된 프로젝트 ID (null이면 독립 일정)
- **users**: 전체 사원 목록
- **selectedMemberIds**: 선택된 참여자 ID 배열
- **projects**: 전체 프로젝트 목록
- **loading**: 일정 생성 중 상태
- **error**: 에러 메시지
- **loadingUsers/loadingProjects**: 데이터 로딩 상태

## 데이터 흐름

### 초기 데이터 로딩

페이지 마운트 시 (`useEffect`):

1. 프로젝트 전체 목록 조회 (`getAllProjects`)
2. 사원 전체 목록 조회 (`getAllUsers`)
3. 두 API를 병렬로 호출 (`Promise.all`)

```typescript
useEffect(() => {
  const loadData = async () => {
    setLoadingProjects(true);
    setLoadingUsers(true);
    try {
      const [projectsData, usersData] = await Promise.all([
        getAllProjects(),
        getAllUsers(),
      ]);
      setProjects(projectsData);
      setUsers(usersData);
    } catch (error) {
      console.error('프로젝트 및 사원 목록 로딩 실패:', error);
      setError('필요한 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoadingProjects(false);
      setLoadingUsers(false);
    }
  };

  loadData();
}, []);
```

### 폼 제출 흐름

1. **폼 검증** (`handleSubmit`)
   - 제목 비어있지 않은지 확인
   - 시작일/종료일 선택 여부 확인
   - 시작일이 종료일보다 늦지 않은지 확인

2. **API 호출** (`createSchedule`)
   - `ScheduleCreateRequest` 객체 생성
   - 날짜를 `yyyy-MM-dd` 형식으로 변환 (`format` from date-fns)
   - 선택된 참여자 ID 배열 또는 null 전송

3. **성공 처리**
   - 일정 목록 페이지(`/schedules`)로 이동

4. **에러 처리**
   - 에러 메시지를 Alert 컴포넌트로 표시
   - 사용자가 dismissible Alert로 에러를 닫을 수 있음

## 화면 갱신

### 사용자 입력에 따른 갱신

- **제목 입력**: `title` 상태 즉시 업데이트
- **타입 선택**: `scheduleType` 상태 즉시 업데이트
- **날짜 범위 선택**: `dateRange`, `startDate`, `endDate` 동시 업데이트
- **프로젝트 선택**: `projectId` 상태 업데이트
- **참여자 선택**: `selectedMemberIds` 배열에 추가/제거

### API 호출 후 갱신

- **성공**: 페이지 이동 (상태 초기화)
- **실패**: 에러 메시지 표시, 폼 상태 유지

## 레이아웃 구조

```
ScheduleCreatePage
├── 헤더
│   ├── 제목 ("일정 등록")
│   └── "목록으로" 버튼
│
├── 에러 Alert (조건부)
│
├── 기본 정보 섹션 (카드)
│   ├── 일정 제목 (필수)
│   ├── 타입 (드롭다운)
│   ├── 기간 (DatePicker, 범위 선택)
│   └── 프로젝트 (드롭다운, 선택사항)
│
├── 참여자 섹션 (카드)
│   └── 참여자 목록 (멀티 체크박스)
│       └── 각 사원: 아바타 + 이름 + 직급
│
└── 제출 버튼 영역
    ├── 취소 버튼
    └── 일정 등록 버튼 (제출)
```

## 주요 컴포넌트

### DatePicker

- `react-datepicker` 사용
- `selectsRange` prop으로 날짜 범위 선택
- 한국어 로케일 적용 (`ko` from date-fns/locale)
- 날짜 형식: `yyyy-MM-dd`

### Alert

- 에러 메시지 표시용
- `dismissible` prop으로 닫기 기능 제공
- `onClose` 콜백으로 상태 초기화

## API 연동

### 사용 API

1. **프로젝트 목록 조회**
   - `getAllProjects()` from `frontend/src/api/project.ts`
   - `GET /projects?page=0&size=1000`
   - 페이징 없이 전체 목록 조회

2. **사원 목록 조회**
   - `getAllUsers()` from `frontend/src/api/user.ts`
   - `GET /users?page=0&size=1000`
   - 페이징 없이 전체 목록 조회

3. **일정 생성**
   - `createSchedule()` from `frontend/src/api/schedule.ts`
   - `POST /schedules`
   - ADMIN 권한 필요
   - 요청 본문: `ScheduleCreateRequest`

### 요청/응답 타입

```typescript
interface ScheduleCreateRequest {
  title: string;
  startDate: string; // yyyy-MM-dd
  endDate: string; // yyyy-MM-dd
  scheduleType?: string; // PROJECT, TEST_RUN, WIRING, DESIGN, MEETING
  projectId?: number | null;
  memberIds?: number[] | null;
}
```

## 검증 규칙

### 필수 필드

- **일정 제목**: 비어있지 않아야 함 (`title.trim()`)
- **시작일/종료일**: 둘 다 선택되어야 함

### 비즈니스 규칙

- 시작일이 종료일보다 늦을 수 없음
- 프로젝트 선택은 선택사항 (null 허용)
- 참여자 선택은 선택사항 (빈 배열이면 null 전송)

## 에러 처리

### 에러 유형

1. **데이터 로딩 실패**
   - 프로젝트/사원 목록 조회 실패
   - 에러 메시지: "필요한 정보를 불러오는데 실패했습니다."

2. **폼 검증 실패**
   - 클라이언트 측 검증 에러
   - Alert로 에러 메시지 표시

3. **일정 생성 실패**
   - 서버 에러 (네트워크, 권한, 검증 등)
   - `error.response?.data?.message` 또는 기본 메시지 표시

## 라우팅

- **경로**: `/schedules/new`
- **권한**: ADMIN (`requireAdmin` prop)
- **라우트 정의**: `frontend/src/App.tsx`

```typescript
<Route
  path="/schedules/new"
  element={
    <ProtectedRoute requireAdmin>
      <ScheduleCreatePage />
    </ProtectedRoute>
  }
/>
```

## 유지보수 포인트

### 날짜 처리

- `date-fns`의 `format` 함수 사용
- ISO 형식(`yyyy-MM-dd`)으로 변환하여 서버 전송
- `react-datepicker`와 Date 객체로 상호작용

### 상태 동기화

- `dateRange`와 `startDate/endDate` 동시 관리
- `handleDateRangeChange`에서 모든 날짜 상태 업데이트

### 프로젝트 선택

- 프로젝트 선택은 선택사항
- "프로젝트를 선택하지 않음 (독립 일정)" 옵션 제공
- null 값이면 독립 일정으로 생성

### 참여자 선택

- 멀티 체크박스로 구현
- `handleMemberToggle`로 배열에 추가/제거
- 빈 배열이면 null로 전송 (서버 요구사항)

## 참고 파일

- API 클라이언트: `frontend/src/api/schedule.ts`
- 프로젝트 API: `frontend/src/api/project.ts`
- 사원 API: `frontend/src/api/user.ts`
- 유사 페이지: `frontend/src/pages/ProjectCreatePage.tsx`

