# 📊 대시보드 개발 문서

## 개요

ScheduleFlow 대시보드 페이지 및 관련 컴포넌트 구현 내용을 정리한 문서입니다.

## 구현 완료 항목

- [x] Tailwind CSS 설정
- [x] Header 컴포넌트 구현
- [x] Sidebar 컴포넌트 구현
- [x] Layout 컴포넌트 구현 (Header + Sidebar + Content)
- [x] DashboardPage 기본 레이아웃
- [x] Calendar 컴포넌트 구현
- [x] 캘린더 API 클라이언트 함수
- [x] 프로젝트 바 렌더링
- [x] MyTasks 컴포넌트 구현
- [x] TeamTasks 컴포넌트 구현

---

## 1. Tailwind CSS 설정

### 설치 및 설정

```bash
npm install -D tailwindcss@^3.4.0 postcss autoprefixer
```

### 설정 파일

**`tailwind.config.js`:**
```javascript
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**`postcss.config.js`:**
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

**`src/index.css`:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 왜 Tailwind CSS를 선택했을까요?

1. **빠른 개발 속도**
   - 유틸리티 클래스로 즉시 스타일링
   - CSS 파일 작성 불필요

2. **일관된 디자인**
   - 미리 정의된 스페이싱, 색상 시스템
   - 디자인 일관성 확보

3. **번들 크기 최적화**
   - 사용하지 않는 스타일 자동 제거 (PurgeCSS)
   - 최종 번들 크기 최소화

---

## 2. Header 컴포넌트

### 파일 위치
`src/components/Header.tsx`

### 주요 기능

1. **로고 표시**
   - "ScheduleFlow" 텍스트 로고

2. **사용자 프로필 표시**
   - 사용자명 첫 글자 아바타 (원형)
   - 사용자명 표시
   - 드롭다운 아이콘

3. **프로필 드롭다운 메뉴**
   - 내 정보 (추후 구현 예정)
   - 로그아웃

### 구현 포인트

#### 드롭다운 상태 관리
```typescript
const [isDropdownOpen, setIsDropdownOpen] = useState(false);
const dropdownRef = useRef<HTMLDivElement>(null);

// 외부 클릭 시 드롭다운 닫기
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsDropdownOpen(false);
    }
  };
  // ...
}, [isDropdownOpen]);
```

**왜 이렇게 설계했을까요?**
- `useRef`로 DOM 요소 참조
- `useEffect`로 이벤트 리스너 등록/해제
- 외부 클릭 시 자동으로 드롭다운 닫기 (UX 개선)

#### 로그아웃 처리
```typescript
const handleLogout = () => {
  logout(); // authStore의 logout 함수 호출
  navigate('/login'); // 로그인 페이지로 리다이렉트
};
```

### 스타일링

- Tailwind CSS 유틸리티 클래스 사용
- 반응형 디자인 (flexbox)
- 호버 효과 및 트랜지션

---

## 3. Sidebar 컴포넌트

### 파일 위치
`src/components/Sidebar.tsx`

### 주요 기능

1. **메뉴 목록 표시**
   - 대시보드 (/)
   - 프로젝트 (/projects)
   - 파일 (/files)
   - 일정 (/schedules)
   - 거래처 (/partners)
   - 사원 (/admin/users) - ADMIN 전용

2. **현재 페이지 하이라이트**
   - 활성 메뉴: 파란색 배경 (`bg-blue-500`)
   - 비활성 메뉴: 회색 배경 (호버 시)

3. **동적 라우트 매칭**
   - `/projects/:id` 같은 동적 라우트도 프로젝트 메뉴 활성화

### 구현 포인트

#### 현재 페이지 감지
```typescript
const location = useLocation();

const isActive = (menuPath: string): boolean => {
  if (menuPath === '/') {
    return location.pathname === '/';
  }
  return location.pathname.startsWith(menuPath);
};
```

**왜 이렇게 설계했을까요?**
- `useLocation` 훅으로 현재 경로 확인
- 대시보드는 정확히 `/`만 매칭 (startsWith 사용 시 모든 경로가 매칭됨)
- 동적 라우트 지원 (`/projects/:id` → 프로젝트 메뉴 활성화)

#### 권한 체크
```typescript
const visibleMenuItems = menuItems.filter((item) => {
  if (item.requireAdmin) {
    return user?.role === 'ADMIN';
  }
  return true;
});
```

- ADMIN 전용 메뉴는 권한 체크 후 표시/숨김
- 일반 사용자는 사원 메뉴가 보이지 않음

---

## 4. Layout 컴포넌트

### 파일 위치
`src/components/Layout.tsx`

### 레이아웃 구조

```
┌─────────────────────────────────┐
│           Header                │ ← 고정 (h-16)
├──────────┬──────────────────────┤
│          │                      │
│ Sidebar  │      Content         │ ← flex-1 (남은 공간)
│ (w-64)   │    (flex-1)          │
│          │   (overflow-y-auto)  │
└──────────┴──────────────────────┘
```

### 구현 포인트

```tsx
<div className="h-screen flex flex-col bg-gray-100">
  {/* Header */}
  <Header />

  {/* Sidebar + Content */}
  <div className="flex flex-1 overflow-hidden">
    <Sidebar />
    <main className="flex-1 overflow-y-auto bg-white">
      {children}
    </main>
  </div>
</div>
```

**왜 이렇게 설계했을까요?**

1. **Flexbox 레이아웃**
   - `h-screen flex flex-col`: 전체 화면 높이, 수직 방향 플렉스
   - Header는 고정 높이 (`h-16`)
   - 나머지 영역은 `flex-1`로 남은 공간 사용

2. **스크롤 처리**
   - Content 영역만 `overflow-y-auto`로 스크롤 가능
   - Header와 Sidebar는 고정 (스크롤 안 됨)

3. **ProtectedRoute 통합**
   - 모든 보호된 라우트에 자동으로 Layout 적용
   - 공개 라우트(로그인, 회원가입)는 Layout 없이 표시

---

## 5. DashboardPage 레이아웃

### 파일 위치
`src/pages/DashboardPage.tsx`

### 레이아웃 구조

- **캘린더 영역**: 좌측 65%
- **우측 영역**: 35%
  - 상단: My Tasks (50%)
  - 하단: 팀원 오늘 일정 (50%)

### 구현

```tsx
<div className="flex gap-6 h-full">
  {/* 캘린더 영역 - 좌측 65% */}
  <div className="flex-1" style={{ flexBasis: '65%' }}>
    <Calendar />
  </div>

  {/* 우측 영역 - 35% */}
  <div className="flex-1 flex flex-col gap-6" style={{ flexBasis: '35%' }}>
    <MyTasks />
    <TeamTasks />
  </div>
</div>
```

---

## 6. Calendar 컴포넌트

### 파일 위치
`src/components/Calendar.tsx`

### 주요 기능

1. **월간 캘린더 보기 (Month View)**
   - 7열 그리드 (일주일)
   - 주 단위로 월 시작/끝 맞춤

2. **이전/다음 월 네비게이션**
   - 화살표 버튼으로 월 이동

3. **토글 모드**
   - 프로젝트: 프로젝트 바만 표시
   - 프로젝트+일정: 프로젝트 바 + 일정 표시
   - 기본일정: 기본 일정만 표시

4. **오늘 날짜 강조**
   - 파란색 배경 (`bg-blue-50`)
   - 파란색 텍스트 (`text-blue-600`)

5. **프로젝트 바 렌더링**
   - 연결된 바 형태 (여러 날짜에 걸쳐)
   - 시작일: 왼쪽만 둥글게 (`rounded-l`)
   - 종료일: 오른쪽만 둥글게 (`rounded-r`)
   - 중간 날짜: 직사각형 (`rounded-none`)

### 구현 포인트

#### 날짜 계산 (date-fns 사용)

```typescript
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek,
  format,
  // ...
} from 'date-fns';

const monthStart = startOfMonth(currentDate);
const monthEnd = endOfMonth(currentDate);
const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
```

**왜 date-fns를 선택했을까요?**

1. **순수 함수 기반**
   - 불변성 유지 (원본 Date 객체 변경하지 않음)
   - 함수형 프로그래밍 패러다임

2. **모듈화**
   - 필요한 함수만 import (tree-shaking)
   - 번들 크기 최소화

3. **TypeScript 지원**
   - 완벽한 타입 정의
   - 타입 안정성 확보

#### 데이터 로딩

```typescript
useEffect(() => {
  const loadData = async () => {
    setLoading(true);
    try {
      if (mode === 'PROJECT') {
        const data = await getProjectsByPeriod(monthStart, monthEnd);
        setProjects(data);
      } else if (mode === 'PROJECT_WITH_TASK') {
        const data = await getProjectsByPeriodWithSchedules(monthStart, monthEnd);
        setProjectsWithSchedules(data);
      } else if (mode === 'BASE_TODO') {
        const data = await getSchedulesByPeriod(monthStart, monthEnd);
        setBaseSchedules(data);
      }
    } catch (error) {
      console.error('캘린더 데이터 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  loadData();
}, [mode, format(currentDate, 'yyyy-MM')]);
```

**의존성 배열 최적화:**
- `currentDate`를 문자열로 변환하여 의존성 배열에 추가
- Date 객체는 참조 비교이므로 매 렌더마다 새로운 참조로 인식됨
- 문자열로 변환하면 값 비교가 되어 불필요한 재렌더링 방지

#### 프로젝트 바 연결 렌더링

```typescript
// 둥근 모서리 결정
let roundedClass = 'rounded-none'; // 기본: 직사각형
if (isOnlyOneDay) {
  roundedClass = 'rounded'; // 하루짜리: 모든 모서리
} else if (isStart) {
  roundedClass = 'rounded-l'; // 시작일: 왼쪽만
} else if (isEnd) {
  roundedClass = 'rounded-r'; // 종료일: 오른쪽만
}
```

**연결된 바 효과:**
- 프로젝트 바 컨테이너에 `-mx-2` 적용하여 좌우 패딩 상쇄
- 셀 경계까지 프로젝트 바가 닿도록 처리
- 시작일/종료일/중간에 따라 다른 둥근 모서리 적용

#### 날짜 범위 체크

```typescript
const isDateInProjectRange = (date: Date, startDateStr: string, endDateStr: string): boolean => {
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  
  return (
    (isEqual(dateOnly, startDateOnly) || isAfter(dateOnly, startDateOnly)) &&
    (isEqual(dateOnly, endDateOnly) || isBefore(dateOnly, endDateOnly))
  );
};
```

**날짜 비교 시 주의사항:**
- 시간 부분을 제거하여 날짜만 비교
- `isEqual`, `isAfter`, `isBefore` 함수 사용

---

## 7. 캘린더 API 클라이언트

### 파일 위치
`src/api/calendar.ts`

### API 함수

#### 1. getProjectsByPeriod
```typescript
export const getProjectsByPeriod = async (
  startDate: Date,
  endDate: Date
): Promise<ProjectCalendarResponse[]>
```

**엔드포인트:** `GET /projects/period`

**용도:** 프로젝트만 조회 (프로젝트 모드)

#### 2. getProjectsByPeriodWithSchedules
```typescript
export const getProjectsByPeriodWithSchedules = async (
  startDate: Date,
  endDate: Date
): Promise<ProjectCalendarWithSchedulesResponse[]>
```

**엔드포인트:** `GET /projects/period/with-schedules`

**용도:** 프로젝트 + 일정 조회 (프로젝트+일정 모드)

#### 3. getSchedulesByPeriod
```typescript
export const getSchedulesByPeriod = async (
  startDate: Date,
  endDate: Date
): Promise<ScheduleCalendarResponse[]>
```

**엔드포인트:** `GET /schedules/period`

**용도:** 기본 일정 조회 (기본일정 모드)

#### 4. getMyTasks
```typescript
export const getMyTasks = async (
  startDate: Date,
  endDate: Date
): Promise<MyTaskResponse[]>
```

**엔드포인트:** `GET /schedules/my-tasks`

**용도:** 이번달 내 할 일 조회 (JWT 토큰에서 자동으로 userId 추출)

#### 5. getTodayTeamTasks
```typescript
export const getTodayTeamTasks = async (
  date: Date
): Promise<TodayTeamTaskResponse[]>
```

**엔드포인트:** `GET /users/team-tasks`

**용도:** 팀원 오늘 일정 조회

### 타입 정의

```typescript
export interface ProjectCalendarResponse {
  id: number;
  name: string;
  startDate: string; // ISO date string
  endDate: string;
  colorCode: string | null;
  status: string | null;
}

export interface ScheduleCalendarResponse {
  scheduleId: number;
  title: string;
  startDate: string;
  endDate: string;
  type: string | null;
}

export interface ProjectCalendarWithSchedulesResponse {
  project: ProjectCalendarResponse;
  schedules: ScheduleCalendarResponse[];
}

export interface MyTaskResponse {
  scheduleId: number;
  scheduleTitle: string;
  projectTitle: string;
  scheduleStartDate: string; // ISO date string
  scheduleEndDate: string;
  colorCode: string | null;
  scheduleType: string; // ScheduleType enum 값
}

export interface TodayTeamTaskResponse {
  memberName: string;
  scheduleTitle: string;
  projectTitle: string;
  projectColorCode: string | null;
}
```

---

## 8. 프로젝트 바 렌더링 상세

### 구현 방식

#### 연결된 바 형태

**요구사항:**
- 프로젝트 바가 여러 날짜에 걸쳐 연결되어 보여야 함
- 시작일: 왼쪽만 둥글게
- 종료일: 오른쪽만 둥글게
- 중간 날짜: 직사각형

**해결 방법:**

1. **그리드 gap 제거**
   ```tsx
   // 이전: gap-px
   <div className="grid grid-cols-7 gap-px bg-gray-200">
   
   // 변경: border 사용
   <div className="grid grid-cols-7 border border-gray-200">
     <div className="border-r border-b border-gray-200">
   ```

2. **프로젝트 바 패딩 상쇄**
   ```tsx
   {/* 프로젝트 바 컨테이너 */}
   <div className="space-y-1 mt-1 -mx-2">
   ```
   - `-mx-2`: 셀의 좌우 패딩(`p-2`) 상쇄
   - 프로젝트 바가 셀 경계까지 닿도록 처리

3. **조건부 둥근 모서리**
   ```tsx
   let roundedClass = 'rounded-none'; // 기본: 직사각형
   if (isOnlyOneDay) {
     roundedClass = 'rounded'; // 하루짜리
   } else if (isStart) {
     roundedClass = 'rounded-l'; // 시작일
   } else if (isEnd) {
     roundedClass = 'rounded-r'; // 종료일
   }
   ```

### 시각적 효과

- 프로젝트별 색상 코드 (`colorCode`) 사용
- 여러 프로젝트가 겹칠 경우 세로로 나열
- 텍스트는 시작일/종료일에서만 표시

---

## 9. MyTasks 컴포넌트

### 파일 위치
`src/components/MyTasks.tsx`

### 주요 기능

1. **이번달 내 할 일 목록 표시**
   - 현재 월의 시작일과 종료일 기준으로 할 일 조회
   - 컴포넌트 마운트 시 자동 로딩

2. **카드 형태로 각 할 일 표시**
   - 각 할 일은 하나의 카드로 표시
   - 카드 모서리는 둥글게 (`rounded-lg`)
   - 카드 너비는 레이아웃 전체 (`w-full`)

3. **프로젝트 색상 기반 배경색 적용**
   - 각 카드의 배경색은 프로젝트의 `colorCode`를 연하게 변환
   - HEX 색상을 RGB로 변환 후 투명도 0.1 적용
   - `colorCode`가 없으면 기본 파란색 사용

4. **스크롤 가능한 목록**
   - 할 일이 많아지면 스크롤 생성 (`overflow-y-auto`)

### 구현 포인트

#### 데이터 로딩
```typescript
useEffect(() => {
  let isMounted = true;

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await getMyTasks(monthStart, monthEnd);
      if (isMounted) {
        setTasks(data);
      }
    } catch (error) {
      if (isMounted) {
        console.error('할 일 목록 로딩 실패:', error);
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  };

  loadTasks();

  // cleanup 함수: 컴포넌트가 언마운트되면 실행 취소
  return () => {
    isMounted = false;
  };
}, []);
```

**왜 cleanup 함수를 사용했을까요?**
- `React.StrictMode`로 인해 개발 모드에서 컴포넌트가 두 번 마운트됨
- cleanup 함수로 언마운트 시 상태 업데이트 방지
- 프로덕션에서는 정상적으로 한 번만 호출됨

#### 색상 연하게 처리
```typescript
const getLightBackgroundColor = (colorCode: string | null): string => {
  if (!colorCode) {
    return 'rgba(59, 130, 246, 0.1)'; // 기본 파란색 연하게
  }

  // HEX를 RGB로 변환
  const hex = colorCode.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // 투명도 0.1로 연하게
  return `rgba(${r}, ${g}, ${b}, 0.1)`;
};
```

**색상 변환 로직:**
- HEX 색상 코드를 RGB로 변환
- 투명도 0.1을 적용하여 연한 배경색 생성
- 프로젝트별 색상을 시각적으로 구분

#### 카드 내용 구조
```tsx
{/* 첫 번째 줄: [프로젝트 이름] 스케줄 이름 [스케줄 타입] */}
<div className="flex items-center gap-2 mb-2 flex-wrap">
  <span className="font-semibold text-gray-800">
    [{task.projectTitle}]
  </span>
  <span className="text-gray-900">{task.scheduleTitle}</span>
  <span className="text-sm text-gray-600">
    [{task.scheduleType}]
  </span>
</div>

{/* 두 번째 줄: 시작일 ~ 종료일 */}
<div className="text-sm text-gray-600">
  {formatDate(task.scheduleStartDate)} ~ {formatDate(task.scheduleEndDate)}
</div>
```

**레이아웃 구조:**
- 첫 번째 줄: 프로젝트 이름, 스케줄 이름, 스케줄 타입을 한 줄에 표시
- 두 번째 줄: 시작일과 종료일을 `yyyy.MM.dd` 형식으로 표시
- `flex-wrap`으로 긴 텍스트는 다음 줄로 넘어감

---

## 10. TeamTasks 컴포넌트

### 파일 위치
`src/components/TeamTasks.tsx`

### 주요 기능

1. **오늘 팀원 일정 목록 표시**
   - 오늘 날짜 기준으로 팀원 일정 조회
   - 컴포넌트 마운트 시 자동 로딩

2. **각 팀원 일정을 카드 형태로 표시**
   - 각 팀원 일정은 하나의 카드로 표시
   - 카드 모서리는 둥글게 (`rounded-lg`)
   - 카드 너비는 레이아웃 전체 (`w-full`)
   - 흰색 배경 + 회색 테두리

3. **프로젝트 색상 기반 점 표시**
   - 각 카드의 첫 번째 줄에 프로젝트 색상의 원형 점 표시
   - 점 크기: `w-3 h-3`
   - `colorCode`가 없으면 기본 파란색 사용

4. **스크롤 가능한 목록**
   - 일정이 많아지면 스크롤 생성 (`overflow-y-auto`)

### 구현 포인트

#### 데이터 로딩
```typescript
useEffect(() => {
  let isMounted = true;

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await getTodayTeamTasks(today);
      if (isMounted) {
        setTasks(data);
      }
    } catch (error) {
      if (isMounted) {
        console.error('팀원 일정 로딩 실패:', error);
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  };

  loadTasks();

  // cleanup 함수: 컴포넌트가 언마운트되면 실행 취소
  return () => {
    isMounted = false;
  };
}, []);
```

**MyTasks와 동일한 패턴:**
- cleanup 함수로 언마운트 시 상태 업데이트 방지
- `React.StrictMode` 대응

#### 점(원형) 표시
```tsx
<div
  className="w-3 h-3 rounded-full flex-shrink-0"
  style={{
    backgroundColor: getProjectColor(task.projectColorCode),
  }}
/>
```

**점 스타일링:**
- `w-3 h-3`: 작은 원형 크기
- `rounded-full`: 완전한 원형
- `flex-shrink-0`: flex 레이아웃에서 크기 유지
- 인라인 스타일로 동적 색상 적용

#### 카드 내용 구조
```tsx
{/* 첫 번째 줄: 점(프로젝트 색상) + 이름 */}
<div className="flex items-center gap-2 mb-2">
  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ... }} />
  <span className="font-semibold text-gray-800">
    {task.memberName}
  </span>
</div>

{/* 두 번째 줄: 프로젝트 + 스케줄 */}
<div className="text-sm text-gray-600 pl-5">
  {task.projectTitle} {task.scheduleTitle}
</div>
```

**레이아웃 구조:**
- 첫 번째 줄: 프로젝트 색상 점 + 팀원 이름
- 두 번째 줄: 프로젝트 이름 + 스케줄 이름 (들여쓰기 적용)
- `pl-5`로 두 번째 줄을 들여쓰기하여 계층 구조 표현

---

## 11. React.StrictMode와 API 호출

### 개발 모드에서 API가 두 번 호출되는 이유

`React.StrictMode`는 개발 모드에서 컴포넌트를 두 번 마운트하여 부작용을 감지합니다. 이로 인해 `useEffect`가 두 번 실행되어 API가 두 번 호출됩니다.

**현상:**
- 개발 모드: 각 API가 두 번 호출됨 (3개 API → 6개 호출)
- 프로덕션 모드: 각 API가 한 번만 호출됨 (정상)

### 해결 방법: cleanup 함수 사용

모든 데이터 로딩 `useEffect`에 cleanup 함수를 추가하여 언마운트 시 상태 업데이트를 방지합니다:

```typescript
useEffect(() => {
  let isMounted = true;

  const loadData = async () => {
    // ... API 호출
    if (isMounted) {
      setData(data); // 마운트된 경우에만 상태 업데이트
    }
  };

  loadData();

  return () => {
    isMounted = false; // cleanup: 언마운트 시 플래그 설정
  };
}, [dependencies]);
```

**왜 이렇게 설계했을까요?**

1. **메모리 누수 방지**
   - 컴포넌트가 언마운트된 후에도 비동기 작업이 완료되면 상태 업데이트 시도
   - `isMounted` 플래그로 방지

2. **React.StrictMode 대응**
   - 개발 모드에서 두 번 마운트되는 것을 정상 동작으로 인식
   - 프로덕션에서는 한 번만 호출되므로 성능 문제 없음

3. **안전한 비동기 처리**
   - cleanup 함수로 컴포넌트 생명주기와 비동기 작업 동기화

---

## 생성된 파일 구조

```
frontend/src/
├── components/
│   ├── Header.tsx              # 헤더 컴포넌트
│   ├── Sidebar.tsx             # 사이드바 컴포넌트
│   ├── Layout.tsx              # 레이아웃 래퍼 컴포넌트
│   ├── Calendar.tsx            # 캘린더 컴포넌트
│   ├── MyTasks.tsx             # 이번달 내 할 일 컴포넌트
│   └── TeamTasks.tsx           # 팀원 오늘 일정 컴포넌트
├── pages/
│   └── DashboardPage.tsx       # 대시보드 페이지
├── api/
│   └── calendar.ts             # 캘린더 API 클라이언트
└── ...
```

---

## 다음 단계 (미구현)

### 대시보드 우측 영역
- [x] My Tasks 컴포넌트 구현
- [x] 팀원 오늘 일정 컴포넌트 구현
- [ ] My Tasks 최대 8개 표시 + 더보기 기능 (추후)

### 캘린더 추가 기능
- [ ] 프로젝트/일정 클릭 시 상세 모달
- [ ] 프로젝트 바 호버 효과 및 툴팁
- [ ] 캘린더 이벤트 드래그 앤 드롭 (추후)

---

## 참고 문서

- [dashboard-frame.md](dashboard-frame.md) - 대시보드 화면 구성 설계 문서

