# 일정 상세 페이지 구현 문서

## 개요

일정 상세 페이지(`ScheduleDetailPage`)는 일정의 상세 정보를 조회하고, ADMIN 권한으로 수정/삭제할 수 있는 페이지입니다. 읽기 모드와 편집 모드를 구분하여 제공합니다.

## 파일 위치

- `frontend/src/pages/ScheduleDetailPage.tsx`

## 주요 기능

1. **일정 상세 정보 조회**
   - 일정 기본 정보 표시 (제목, 타입, 기간, 프로젝트)
   - 참여자 목록 표시

2. **일정 수정** (ADMIN 권한)
   - 편집 모드 전환
   - 일정 정보 수정
   - 저장 후 읽기 모드로 전환

3. **일정 삭제** (ADMIN 권한)
   - 확인 다이얼로그 후 삭제
   - 성공 시 일정 목록 페이지로 이동

## 상태 관리

### 읽기 모드 상태

```typescript
// 일정 데이터
const [schedule, setSchedule] = useState<ScheduleDetailResponse | null>(null);
const [projectName, setProjectName] = useState<string | null>(null);
const [loading, setLoading] = useState<boolean>(false);
const [error, setError] = useState<string | null>(null);

// 편집 모드
const [isEditing, setIsEditing] = useState<boolean>(false);
```

### 편집 모드 상태

편집 모드에서는 일정 등록 페이지와 동일한 상태 구조 사용:

```typescript
// 편집 모드 상태
const [title, setTitle] = useState<string>('');
const [startDate, setStartDate] = useState<Date | null>(null);
const [endDate, setEndDate] = useState<Date | null>(null);
const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
const [scheduleType, setScheduleType] = useState<string>('PROJECT');
const [projectId, setProjectId] = useState<number | null>(null);
const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);

// 편집 모드용 데이터
const [projects, setProjects] = useState<ProjectListResponse[]>([]);
const [users, setUsers] = useState<UserListResponse[]>([]);
const [loadingProjects, setLoadingProjects] = useState<boolean>(false);
const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
```

### 상태 설명

- **schedule**: 일정 상세 정보 (API 응답)
- **projectName**: 프로젝트 이름 (별도 조회)
- **loading**: 로딩 상태 (조회, 수정, 삭제)
- **error**: 에러 메시지
- **isEditing**: 편집 모드 여부
- **편집 모드 상태들**: 일정 등록 페이지와 동일한 구조

## 데이터 흐름

### 초기 데이터 로딩

페이지 마운트 시 (`useEffect`):

1. URL 파라미터에서 일정 ID 추출
2. 일정 상세 정보 조회 (`getScheduleDetail`)
3. 프로젝트가 있으면 프로젝트 이름 조회 (`getProjectDetail`)

```typescript
useEffect(() => {
  if (!id) return;

  const loadSchedule = async () => {
    setLoading(true);
    setError(null);
    try {
      const scheduleId = parseInt(id, 10);
      const scheduleData = await getScheduleDetail(scheduleId);
      setSchedule(scheduleData);

      // 프로젝트가 있으면 프로젝트 이름 조회
      if (scheduleData.projectId) {
        try {
          const projectData = await getProjectDetail(scheduleData.projectId);
          setProjectName(projectData.name);
        } catch (error) {
          console.error('프로젝트 정보 로딩 실패:', error);
        }
      }
    } catch (error: any) {
      // 에러 처리
    } finally {
      setLoading(false);
    }
  };

  loadSchedule();
}, [id]);
```

### 편집 모드 진입 시 데이터 로딩

편집 모드로 전환 시 (`useEffect` with `isEditing` dependency):

1. 프로젝트 전체 목록 조회 (`getAllProjects`)
2. 사원 전체 목록 조회 (`getAllUsers`)
3. 두 API를 병렬로 호출 (`Promise.all`)

```typescript
useEffect(() => {
  if (!isEditing) return;

  const loadEditData = async () => {
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
      setError('편집에 필요한 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoadingProjects(false);
      setLoadingUsers(false);
    }
  };

  loadEditData();
}, [isEditing]);
```

### 편집 모드 상태 초기화

일정 데이터를 편집 모드 상태로 복사 (`useEffect` with `schedule` and `isEditing` dependencies):

```typescript
useEffect(() => {
  if (schedule && isEditing) {
    setTitle(schedule.title);
    setStartDate(new Date(schedule.startDate));
    setEndDate(new Date(schedule.endDate));
    setDateRange([new Date(schedule.startDate), new Date(schedule.endDate)]);
    setScheduleType(schedule.type);
    setProjectId(schedule.projectId);
    setSelectedMemberIds(schedule.members.map((m) => m.id));
  }
}, [schedule, isEditing]);
```

### 수정 저장 흐름

1. **폼 검증** (`handleSave`)
   - 제목 비어있지 않은지 확인
   - 시작일이 종료일보다 늦지 않은지 확인

2. **API 호출** (`updateSchedule`)
   - `ScheduleUpdateRequest` 객체 생성
   - 날짜를 `yyyy-MM-dd` 형식으로 변환

3. **성공 처리**
   - 일정 데이터 업데이트
   - 프로젝트 이름 업데이트 (프로젝트가 있는 경우)
   - 편집 모드 종료 (`setIsEditing(false)`)

4. **에러 처리**
   - 에러 메시지를 Alert로 표시

### 삭제 흐름

1. **확인 다이얼로그** (`handleDelete`)
   - `window.confirm`으로 확인 요청

2. **API 호출** (`deleteSchedule`)
   - 일정 삭제 API 호출

3. **성공 처리**
   - 일정 목록 페이지로 이동 (`navigate('/schedules')`)

4. **에러 처리**
   - 에러 메시지를 Alert로 표시

## 화면 갱신

### 읽기 모드

- 일정 정보를 텍스트로 표시
- 타입은 배지 형태로 표시 (색상 구분)
- 참여자는 리스트 형태로 표시

### 편집 모드 전환

1. "수정" 버튼 클릭 → `setIsEditing(true)`
2. 편집 모드 데이터 로딩 (프로젝트, 사원 목록)
3. 일정 데이터를 편집 모드 상태로 복사
4. 입력 필드로 전환

### 편집 모드

- 일정 등록 페이지와 동일한 입력 폼
- 제목: 텍스트 입력
- 타입: 드롭다운 선택
- 기간: DatePicker 범위 선택
- 프로젝트: 드롭다운 선택
- 참여자: 멀티 체크박스

### 저장 후 갱신

- 일정 데이터 업데이트
- 프로젝트 이름 업데이트
- 편집 모드 종료 → 읽기 모드로 전환
- 화면이 업데이트된 데이터로 갱신

### 취소 시

- 편집 모드 종료 (`setIsEditing(false)`)
- 원본 데이터로 상태 복원 (`handleCancel`)
- 읽기 모드로 전환

## 레이아웃 구조

```
ScheduleDetailPage
├── 헤더
│   ├── 일정 제목 + 타입 배지
│   └── 액션 버튼
│       ├── "목록으로" 버튼
│       └── (ADMIN만)
│           ├── 읽기 모드: "수정", "삭제" 버튼
│           └── 편집 모드: "취소", "저장" 버튼
│
├── 에러 Alert (조건부)
│
├── 기본 정보 섹션 (카드)
│   ├── 일정 제목
│   ├── 타입 (읽기: 배지 / 편집: 드롭다운)
│   ├── 기간 (읽기: 텍스트 / 편집: DatePicker)
│   └── 프로젝트 (읽기: 텍스트 / 편집: 드롭다운)
│
└── 참여자 섹션 (카드)
    └── 참여자 목록
        ├── 읽기 모드: 리스트 형태
        └── 편집 모드: 멀티 체크박스
```

## 상태 변경 흐름도

```
[초기 로딩]
  ↓
[일정 데이터 조회]
  ↓
[프로젝트 이름 조회 (프로젝트가 있는 경우)]
  ↓
[읽기 모드 표시]
  ↓
[사용자 액션]
  ├─ [수정 버튼 클릭]
  │   ↓
  │   [편집 모드 진입]
  │   ↓
  │   [편집 데이터 로딩]
  │   ↓
  │   [일정 데이터 → 편집 상태 복사]
  │   ↓
  │   [편집 모드 표시]
  │   ↓
  │   [사용자 액션]
  │   ├─ [저장 버튼 클릭]
  │   │   ↓
  │   │   [폼 검증]
  │   │   ↓
  │   │   [API 호출 (수정)]
  │   │   ↓
  │   │   [일정 데이터 업데이트]
  │   │   ↓
  │   │   [프로젝트 이름 업데이트]
  │   │   ↓
  │   │   [읽기 모드로 전환]
  │   │
  │   └─ [취소 버튼 클릭]
  │       ↓
  │       [원본 데이터로 복원]
  │       ↓
  │       [읽기 모드로 전환]
  │
  └─ [삭제 버튼 클릭]
      ↓
      [확인 다이얼로그]
      ↓
      [API 호출 (삭제)]
      ↓
      [일정 목록 페이지로 이동]
```

## 주요 컴포넌트

### DatePicker

- `react-datepicker` 사용
- 편집 모드에서만 표시
- `selectsRange` prop으로 날짜 범위 선택

### Alert

- 에러 메시지 표시용
- `dismissible` prop으로 닫기 기능 제공

### 타입 배지

- 읽기 모드에서 타입을 배지 형태로 표시
- `getTypeColor()` 함수로 타입별 색상 구분

## API 연동

### 사용 API

1. **일정 상세 조회**
   - `getScheduleDetail()` from `frontend/src/api/schedule.ts`
   - `GET /schedules/{scheduleId}`
   - 응답: `ScheduleDetailResponse`

2. **프로젝트 상세 조회** (프로젝트 이름용)
   - `getProjectDetail()` from `frontend/src/api/project.ts`
   - `GET /projects/{projectId}`
   - 일정에 프로젝트가 연결된 경우에만 호출

3. **프로젝트 목록 조회** (편집 모드용)
   - `getAllProjects()` from `frontend/src/api/project.ts`
   - `GET /projects?page=0&size=1000`

4. **사원 목록 조회** (편집 모드용)
   - `getAllUsers()` from `frontend/src/api/user.ts`
   - `GET /users?page=0&size=1000`

5. **일정 수정**
   - `updateSchedule()` from `frontend/src/api/schedule.ts`
   - `PATCH /schedules/{scheduleId}`
   - ADMIN 권한 필요
   - 요청 본문: `ScheduleUpdateRequest`
   - 응답: `ScheduleDetailResponse`

6. **일정 삭제**
   - `deleteSchedule()` from `frontend/src/api/schedule.ts`
   - `DELETE /schedules/{scheduleId}`
   - ADMIN 권한 필요

### 요청/응답 타입

```typescript
interface ScheduleDetailResponse {
  id: number;
  title: string;
  startDate: string; // yyyy-MM-dd
  endDate: string; // yyyy-MM-dd
  type: 'PROJECT' | 'TEST_RUN' | 'WIRING' | 'DESIGN' | 'MEETING';
  projectId: number | null;
  members: Array<{
    id: number;
    name: string;
    position: string;
  }>;
}

interface ScheduleUpdateRequest {
  title?: string;
  startDate?: string; // yyyy-MM-dd
  endDate?: string; // yyyy-MM-dd
  scheduleType?: string;
  projectId?: number | null;
  memberIds?: number[] | null;
}
```

## 권한 처리

### 읽기 권한

- 모든 인증된 사용자 접근 가능
- `ProtectedRoute`로 인증 체크

### 수정/삭제 권한

- ADMIN 권한만 가능
- `useAuthStore`에서 사용자 권한 확인
- `isAdmin` 변수로 버튼 표시 제어

```typescript
const { user } = useAuthStore();
const isAdmin = user?.role === 'ADMIN';

// 버튼 표시 조건
{isAdmin && (
  <>
    {!isEditing ? (
      <>
        <button onClick={handleEdit}>수정</button>
        <button onClick={handleDelete}>삭제</button>
      </>
    ) : (
      <>
        <button onClick={handleCancel}>취소</button>
        <button onClick={handleSave}>저장</button>
      </>
    )}
  </>
)}
```

## 검증 규칙

### 필수 필드

- **일정 제목**: 비어있지 않아야 함 (`title.trim()`)
- **시작일/종료일**: 둘 다 선택되어야 함 (편집 모드)

### 비즈니스 규칙

- 시작일이 종료일보다 늦을 수 없음
- 프로젝트 선택은 선택사항 (null 허용)
- 참여자 선택은 선택사항 (빈 배열이면 null 전송)

## 에러 처리

### 에러 유형

1. **일정 조회 실패**
   - 404: "일정을 찾을 수 없습니다."
   - 기타: "일정 정보를 불러오는데 실패했습니다."

2. **프로젝트 정보 조회 실패**
   - 일정 조회는 성공했지만 프로젝트 이름 조회 실패
   - 에러 로그만 출력, 화면에는 영향 없음

3. **편집 데이터 로딩 실패**
   - 프로젝트/사원 목록 조회 실패
   - 에러 메시지: "편집에 필요한 정보를 불러오는데 실패했습니다."

4. **일정 수정 실패**
   - 서버 에러 (네트워크, 권한, 검증 등)
   - `error.response?.data?.message` 또는 기본 메시지 표시

5. **일정 삭제 실패**
   - 서버 에러
   - `error.response?.data?.message` 또는 기본 메시지 표시

## 라우팅

- **경로**: `/schedules/:id`
- **권한**: 인증된 사용자 (`ProtectedRoute`)
- **라우트 정의**: `frontend/src/App.tsx`

```typescript
<Route
  path="/schedules/:id"
  element={
    <ProtectedRoute>
      <ScheduleDetailPage />
    </ProtectedRoute>
  }
/>
```

## 유지보수 포인트

### 프로젝트 이름 표시

- 일정 상세 응답에는 `projectId`만 포함
- 프로젝트 이름은 별도 API로 조회 (`getProjectDetail`)
- 읽기 모드에서 프로젝트 이름 표시
- 수정 후 프로젝트가 변경된 경우 프로젝트 이름 재조회

### 편집 모드 상태 관리

- 읽기 모드와 편집 모드 상태 분리
- 편집 모드 진입 시 원본 데이터 복사
- 취소 시 원본 데이터로 복원

### 날짜 처리

- API 응답은 문자열 (`yyyy-MM-dd`)
- 편집 모드에서는 Date 객체로 변환
- 서버 전송 시 다시 문자열로 변환 (`format` from date-fns)

### 타입 색상 구분

- `getTypeColor()` 함수로 타입별 색상 반환
- 프로젝트 상세 페이지와 유사한 배지 스타일

### 참여자 ID 매핑

- 일정 상세 응답의 `members`는 `ScheduleMemberDto` (id는 ScheduleMember의 id)
- 편집 모드에서는 User의 id를 사용
- `schedule.members.map((m) => m.id)`로 매핑 (주의 필요)
  - 실제로는 `member.user.id`를 사용해야 할 수도 있음
  - 백엔드 응답 구조 확인 필요

## 참고 파일

- API 클라이언트: `frontend/src/api/schedule.ts`
- 프로젝트 API: `frontend/src/api/project.ts`
- 사원 API: `frontend/src/api/user.ts`
- 유사 페이지: `frontend/src/pages/ProjectDetailPage.tsx`
- 등록 페이지: `frontend/src/pages/ScheduleCreatePage.tsx`

