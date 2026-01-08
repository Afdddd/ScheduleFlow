# 프로젝트 등록 페이지 개발 문서

## 개요

프로젝트 등록 페이지(`ProjectCreatePage.tsx`)는 ScheduleFlow의 핵심 기능 중 하나로, 프로젝트 기본 정보, 거래처/연락처, 멤버, 일정, 파일을 한 번에 등록할 수 있는 통합 폼입니다.

## 1. 상태관리 (State Management)

### 1.1 왜 useState를 사용했을까?

이 페이지는 **복잡한 폼 상태**를 다루지만, **전역 상태 관리가 필요하지 않은** 경우입니다. Redux나 Context API를 사용하지 않고 `useState`만으로 충분한 이유는:

- **페이지 단위의 독립적인 상태**: 프로젝트 등록 페이지에서만 사용되는 상태
- **단순한 부모-자식 관계**: 상태를 하위 컴포넌트로 전달할 필요가 거의 없음
- **폼 제출 시점에만 서버로 전송**: 중간 상태를 다른 컴포넌트와 공유할 필요 없음

만약 프로젝트 목록 페이지에서도 이 상태를 공유해야 한다면, Context API나 전역 상태 관리 라이브러리를 고려해야 합니다.

### 1.2 상태 구조

```typescript
// 기본 정보 상태
const [name, setName] = useState<string>('');
const [clientId, setClientId] = useState<number | null>(null);
const [startDate, setStartDate] = useState<Date | null>(null);
const [endDate, setEndDate] = useState<Date | null>(null);
const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
const [status, setStatus] = useState<string>('IN_PROGRESS');
const [description, setDescription] = useState<string>('');
const [colorCode, setColorCode] = useState<string>('#3b82f6');
```

**왜 `dateRange`와 `startDate`, `endDate`를 분리했을까?**

- `dateRange`: `react-datepicker`의 `selectsRange` prop이 요구하는 형식 `[Date | null, Date | null]`
- `startDate`, `endDate`: 프로젝트 생성 API 요청 시 필요한 개별 필드

두 가지를 동시에 관리하는 이유는 **라이브러리 요구사항**과 **비즈니스 로직**을 분리하기 위함입니다. 이렇게 하면 나중에 날짜 선택 라이브러리를 바꾸더라도 API 요청 부분은 수정할 필요가 없습니다.

### 1.3 로컬 상태로 관리하는 데이터

```typescript
// 일정 (프로젝트 생성 전까지 로컬 상태)
const [schedules, setSchedules] = useState<LocalSchedule[]>([]);

// 파일 (프로젝트 생성 전까지 로컬 상태)
const [files, setFiles] = useState<LocalFile[]>([]);
```

**왜 일정과 파일을 로컬 상태로 관리할까?**

프로젝트가 생성되기 전까지는 일정과 파일에 대한 **프로젝트 ID가 없습니다**. 따라서 서버에 저장할 수 없고, 메모리에서만 관리해야 합니다. 프로젝트 생성 성공 후에야 각각의 ID를 받아서 일정과 파일을 연결할 수 있습니다.

이런 패턴을 **"Optimistic UI Pattern"**의 반대라고 볼 수 있습니다. 사용자가 입력한 내용을 먼저 화면에 보여주고, 실제 서버 저장은 나중에 하는 방식입니다.

### 1.4 로딩 상태 분리

```typescript
const [loading, setLoading] = useState<boolean>(false);
const [loadingPartners, setLoadingPartners] = useState<boolean>(false);
const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
const [loadingContacts, setLoadingContacts] = useState<boolean>(false);
```

**왜 로딩 상태를 여러 개로 분리했을까?**

각 API 호출이 **독립적으로 실행**되기 때문입니다. 거래처 목록 로딩이 실패해도 사원 목록은 정상적으로 표시되어야 합니다. 하나의 `loading` 상태만 사용하면, 한 곳에서 에러가 발생했을 때 전체 UI가 로딩 상태로 남아버립니다.

## 2. 데이터흐름 (Data Flow)

### 2.1 초기 데이터 로딩

```
페이지 마운트
    ↓
useEffect 실행 (거래처 목록 로딩)
    ↓
useEffect 실행 (사원 목록 로딩)
    ↓
API 호출: GET /partners?page=0&size=1000
API 호출: GET /users?page=0&size=1000
    ↓
상태 업데이트: setPartners(), setUsers()
    ↓
화면 렌더링 (드롭다운에 목록 표시)
```

**왜 `useEffect`를 두 개로 분리했을까?**

두 API 호출은 **서로 독립적**이므로 병렬로 실행할 수 있습니다. 하나의 `useEffect`에서 `Promise.all()`을 사용해도 되지만, 각각 분리하면:
- 에러 처리 개별화 가능
- 로딩 상태 개별 관리 가능
- 코드 가독성 향상

### 2.2 거래처 선택 시 연락처 로딩

```
사용자가 거래처 선택
    ↓
setClientId(clientId) 호출
    ↓
useEffect([clientId]) 트리거
    ↓
clientId가 있으면 → API 호출: GET /partners/{clientId}/contacts
clientId가 없으면 → 연락처 목록 초기화
    ↓
상태 업데이트: setPartnerContacts()
    ↓
선택된 연락처 초기화: setSelectedPartnerContactIds([])
    ↓
화면 갱신 (연락처 목록 표시)
```

**왜 거래처 변경 시 연락처 선택을 초기화할까?**

이전 거래처의 연락처 ID가 새 거래처의 연락처 ID와 겹칠 수 있기 때문입니다. 사용자가 실수로 잘못된 연락처를 선택하는 것을 방지하기 위한 안전장치입니다.

### 2.3 프로젝트 생성 플로우

```
사용자가 "프로젝트 등록" 버튼 클릭
    ↓
handleSubmit() 실행
    ↓
1단계: 폼 검증
    - 필수 필드 체크 (이름, 거래처, 날짜)
    - 날짜 유효성 검증 (시작일 < 종료일)
    ↓
2단계: 프로젝트 생성
    - API 호출: POST /projects
    - 요청 본문: ProjectCreateRequest
    - 응답: 프로젝트 ID (number)
    ↓
3단계: 일정 생성 (순차 실행)
    - schedules 배열을 순회하며
    - 각 일정에 대해 API 호출: POST /schedules
    - 프로젝트 ID 포함하여 요청
    ↓
4단계: 파일 업로드 (순차 실행)
    - files 배열을 순회하며
    - 각 파일에 대해 API 호출: POST /files/{projectId}/upload
    - FormData로 파일과 카테고리 전송
    ↓
5단계: 성공 시 화면 이동
    - navigate(`/projects/${projectId}`)
```

**왜 일정과 파일을 순차적으로 처리할까?**

`for...of` 루프를 사용한 이유는:
- **에러 처리 용이**: 하나가 실패하면 즉시 catch 블록으로 이동
- **사용자 피드백**: 어떤 일정/파일에서 실패했는지 알 수 있음
- **트랜잭션 보장**: 일부만 성공하는 것을 방지

만약 병렬로 처리하려면 `Promise.all()`을 사용할 수 있지만, 일부만 성공했을 때 롤백 처리가 복잡해집니다.

**왜 프로젝트 생성 후에 일정과 파일을 생성할까?**

데이터베이스 설계상 **외래키 제약조건** 때문입니다. 일정과 파일은 프로젝트 ID를 참조하므로, 프로젝트가 먼저 생성되어야 합니다.

## 3. 화면 갱신 (UI Update)

### 3.1 실시간 상태 업데이트

React의 **단방향 데이터 흐름**을 따릅니다:

```
사용자 입력
    ↓
이벤트 핸들러 실행 (예: onChange)
    ↓
setState() 호출
    ↓
React가 상태 변경 감지
    ↓
컴포넌트 재렌더링
    ↓
화면 갱신
```

**예시: 거래처 선택**

```typescript
<select
  value={clientId || ''}
  onChange={(e) => setClientId(e.target.value ? Number(e.target.value) : null)}
>
```

사용자가 드롭다운에서 거래처를 선택하면 → `setClientId()` 호출 → `useEffect([clientId])` 트리거 → 연락처 목록 자동 로딩

### 3.2 조건부 렌더링

```typescript
{!clientId ? (
  <div>거래처를 먼저 선택해주세요.</div>
) : loadingContacts ? (
  <div>로딩 중...</div>
) : partnerContacts.length === 0 ? (
  <div>등록된 연락처가 없습니다.</div>
) : (
  <div>연락처 목록 표시</div>
)}
```

**왜 이렇게 복잡한 조건부 렌더링을 사용했을까?**

사용자 경험(UX)을 위해 **각 상황에 맞는 메시지**를 보여주기 위함입니다:
- 거래처 미선택: 안내 메시지
- 로딩 중: 로딩 인디케이터
- 데이터 없음: 빈 상태 메시지
- 데이터 있음: 실제 목록

이렇게 하면 사용자가 "왜 아무것도 안 보이지?"라고 궁금해하지 않습니다.

### 3.3 프로젝트 생성 후 화면 이동

```typescript
// 성공 시 프로젝트 상세 페이지로 이동
navigate(`/projects/${projectId}`);
```

**왜 프로젝트 목록 페이지가 아닌 상세 페이지로 이동할까?**

1. **생성 확인**: 사용자가 방금 생성한 프로젝트를 바로 확인할 수 있음
2. **일관성**: 다른 CRUD 작업(수정, 삭제) 후에도 상세 페이지로 이동하는 것이 일반적
3. **추가 작업**: 상세 페이지에서 바로 수정하거나 일정/파일을 추가할 수 있음

만약 프로젝트 목록으로 이동한다면, 사용자가 방금 생성한 프로젝트를 찾기 위해 목록을 스크롤해야 하는 불편함이 있습니다.

### 3.4 에러 처리 및 피드백

```typescript
const [error, setError] = useState<string | null>(null);

// 에러 발생 시
setError('프로젝트 이름을 입력해주세요.');

// 성공 시
setError(null);
```

**왜 Alert 컴포넌트를 사용했을까?**

- **일관된 디자인**: 전체 앱에서 동일한 에러 메시지 스타일
- **사용자 친화적**: dismissible 옵션으로 사용자가 직접 닫을 수 있음
- **접근성**: 시각적 피드백과 함께 스크린 리더 지원 가능

## 4. 레이아웃 구조 (Layout Structure)

### 4.1 전체 구조

```
ProjectCreatePage
├── 헤더 (제목 + "목록으로" 버튼)
├── Alert (에러 메시지, 조건부 렌더링)
└── Form
    ├── 상단 섹션: 기본 정보
    │   ├── 프로젝트 이름
    │   ├── 거래처 선택
    │   ├── 날짜 범위 선택
    │   ├── 상태 선택
    │   ├── 설명 입력
    │   └── 색상 코드 선택
    │
    ├── 중간 섹션: 팀 멤버 할당
    │   ├── 사원(멤버) 선택 (왼쪽)
    │   └── 거래처 연락처 선택 (오른쪽)
    │
    ├── 하단 섹션: 일정 및 파일
    │   ├── 일정 등록
    │   │   ├── 일정 추가 버튼
    │   │   ├── 일정 입력 폼 (조건부 렌더링)
    │   │   └── 일정 목록 테이블
    │   └── 파일 업로드
    │       ├── 카테고리 탭
    │       ├── 파일 선택 버튼
    │       └── 파일 목록 테이블
    │
    └── 제출 버튼 영역
        ├── 취소 버튼
        └── 프로젝트 등록 버튼
```

### 4.2 섹션별 설명

#### 상단 섹션: 기본 정보

**레이아웃**: 세로 스택 (`space-y-4`)

**특징**:
- 모든 필드가 동일한 스타일 (`w-full px-4 py-2 border...`)
- 필수 필드는 빨간 별표(`*`) 표시
- `react-datepicker`로 날짜 범위 선택

**왜 이 순서로 배치했을까?**

1. **프로젝트 이름**: 가장 중요한 정보, 맨 위
2. **거래처**: 연락처 선택에 영향을 주므로 이름 다음
3. **날짜 범위**: 일정 등록 시 참조되므로 거래처 다음
4. **상태/설명/색상**: 부가 정보, 하단 배치

#### 중간 섹션: 팀 멤버 할당

**레이아웃**: 2열 그리드 (`grid grid-cols-2 gap-6`)

**특징**:
- 사원과 연락처를 나란히 배치하여 비교하기 쉬움
- 각 영역은 독립적인 스크롤 가능 (`max-h-64 overflow-y-auto`)
- 체크박스 + 아바타/이름으로 시각적 구분

**왜 그리드 레이아웃을 사용했을까?**

화면 공간을 효율적으로 사용하기 위함입니다. 세로로 배치하면 스크롤이 길어지고, 사용자가 사원과 연락처를 동시에 보기 어렵습니다.

#### 하단 섹션: 일정 및 파일

**레이아웃**: 세로 스택, 각 하위 섹션은 독립적

**일정 등록**:
- 토글 방식: "일정 추가" 버튼 클릭 시 폼 표시/숨김
- 폼 내부: 세로 스택으로 모든 필드 배치
- 목록: 테이블 형식으로 일정 목록 표시

**파일 업로드**:
- 탭 방식: 카테고리별로 파일 그룹화
- 동적 필터링: 선택한 카테고리의 파일만 표시

**왜 일정과 파일을 같은 섹션에 배치했을까?**

둘 다 **프로젝트의 부가 정보**이면서, 프로젝트 생성 후에 연결되는 데이터이기 때문입니다. 사용자가 "프로젝트에 관련된 모든 것을 여기서 입력한다"는 인식을 쉽게 할 수 있습니다.

### 4.3 반응형 디자인

현재는 데스크톱 중심으로 설계되었지만, 향후 모바일 대응을 고려하면:

```typescript
// 현재
<div className="grid grid-cols-2 gap-6">

// 모바일 대응 시
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
```

**왜 지금은 반응형을 적용하지 않았을까?**

프로젝트 초기 단계에서는 **기능 구현에 집중**하고, 디바이스별 최적화는 나중에 진행하는 것이 효율적입니다. 하지만 레이아웃 구조를 설계할 때는 향후 확장을 고려해야 합니다.

## 5. 주요 패턴 및 설계 원칙

### 5.1 단일 책임 원칙 (SRP)

각 함수는 하나의 책임만 가집니다:

- `handleSubmit`: 폼 제출 및 API 호출 순서 관리
- `handleAddSchedule`: 일정 추가 및 검증
- `handleFileAdd`: 파일 추가
- `handleDateRangeChange`: 날짜 범위 변경

**왜 이렇게 분리했을까?**

코드 재사용성과 테스트 용이성을 높이기 위함입니다. 하나의 함수가 여러 일을 하면, 수정 시 사이드 이펙트가 발생할 수 있습니다.

### 5.2 조기 반환 (Early Return)

```typescript
if (!name.trim()) {
  setError('프로젝트 이름을 입력해주세요.');
  return;
}
```

**왜 if-else 대신 early return을 사용했을까?**

- **가독성**: 중첩된 if-else를 피할 수 있음
- **명확성**: 에러 조건이 명확하게 드러남
- **유지보수**: 새로운 검증 조건 추가가 쉬움

### 5.3 타입 안정성

```typescript
interface LocalSchedule {
  id: string; // 임시 ID
  title: string;
  startDate: Date;
  endDate: Date;
  type: string;
  memberIds: number[];
}
```

**왜 로컬 타입을 별도로 정의했을까?**

서버의 Schedule 엔티티와는 다른 구조이기 때문입니다:
- `id`: 서버에서는 `number`, 로컬에서는 임시 `string` (UUID 형식)
- `startDate`, `endDate`: 서버에서는 `string` (yyyy-MM-dd), 로컬에서는 `Date`

이렇게 분리하면 타입 안정성을 보장하면서도 각 환경에 맞는 데이터 구조를 사용할 수 있습니다.

## 6. 개선 가능한 부분

### 6.1 상태 관리 최적화

현재는 여러 개의 `useState`를 사용하고 있지만, 복잡도가 높아지면 `useReducer`를 고려할 수 있습니다:

```typescript
// 현재
const [name, setName] = useState('');
const [clientId, setClientId] = useState<number | null>(null);
// ... 10개 이상의 useState

// 개선안 (복잡도가 높아질 경우)
const [formState, dispatch] = useReducer(formReducer, initialState);
```

하지만 현재 수준에서는 `useState`가 더 직관적이고 관리하기 쉽습니다.

### 6.2 에러 처리 개선

현재는 모든 에러를 하나의 `error` 상태로 관리합니다. 각 필드별 에러 메시지를 표시하려면:

```typescript
const [errors, setErrors] = useState<Record<string, string>>({});
```

이렇게 하면 "프로젝트 이름을 입력해주세요"와 "거래처를 선택해주세요"를 동시에 표시할 수 있습니다.

### 6.3 로딩 상태 통합

현재는 각 API별로 로딩 상태를 분리했지만, 사용자 경험 측면에서 전체 로딩 인디케이터를 추가할 수도 있습니다:

```typescript
const [isSubmitting, setIsSubmitting] = useState(false);
```

## 7. 테스트 전략

### 7.1 단위 테스트

- 각 핸들러 함수의 로직 검증
- 폼 검증 로직 테스트
- 날짜 범위 검증 테스트

### 7.2 통합 테스트

- API 호출 순서 검증
- 프로젝트 생성 후 일정/파일 생성 검증
- 에러 처리 검증

### 7.3 E2E 테스트

- 전체 프로젝트 등록 플로우
- 사용자 인터랙션 시나리오

## 8. 참고 자료

- [React 공식 문서 - useState](https://react.dev/reference/react/useState)
- [React 공식 문서 - useEffect](https://react.dev/reference/react/useEffect)
- [react-datepicker 문서](https://reactdatepicker.com/)
- [React Router - useNavigate](https://reactrouter.com/en/main/hooks/use-navigate)

