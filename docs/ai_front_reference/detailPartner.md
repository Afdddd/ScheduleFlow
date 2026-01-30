# 거래처/거래처 직원 상세보기 페이지 구현 문서

## 개요

거래처 상세보기 페이지(`PartnerDetailPage`)는 거래처의 상세 정보를 조회하고, ADMIN 권한으로 거래처와 거래처 직원을 수정/삭제할 수 있는 페이지입니다. 읽기 모드와 편집 모드를 구분하여 제공하며, 거래처 직원 목록도 함께 표시하고 각 직원을 추가/수정/삭제할 수 있습니다.

## 파일 위치

- `frontend/src/pages/PartnerDetailPage.tsx`

## 주요 기능

1. **거래처 상세 정보 조회**
   - 거래처 기본 정보 표시 (회사명, 대표 전화번호, 주소, 설명)
   - 거래처 직원 목록 표시

2. **거래처 수정** (ADMIN 권한)
   - 편집 모드 전환
   - 거래처 정보 수정
   - 저장 후 읽기 모드로 전환

3. **거래처 삭제** (ADMIN 권한)
   - 확인 다이얼로그 후 삭제
   - 성공 시 거래처 목록 페이지로 이동

4. **거래처 직원 관리** (ADMIN 권한)
   - 직원 추가
   - 직원 수정 (인라인 편집)
   - 직원 삭제

## 상태 관리

### 읽기 모드 상태

```typescript
// 거래처 데이터
const [partner, setPartner] = useState<PartnerResponse | null>(null);
const [contacts, setContacts] = useState<PartnerContactResponse[]>([]);
const [loading, setLoading] = useState<boolean>(false);
const [loadingContacts, setLoadingContacts] = useState<boolean>(false);
const [error, setError] = useState<string | null>(null);

// 편집 모드
const [isEditing, setIsEditing] = useState<boolean>(false);
```

### 편집 모드 상태

편집 모드에서는 거래처 등록 페이지와 동일한 상태 구조 사용:

```typescript
// 편집 모드 상태
const [companyName, setCompanyName] = useState<string>('');
const [mainPhone, setMainPhone] = useState<string>('');
const [address, setAddress] = useState<string>('');
const [description, setDescription] = useState<string>('');
```

### 거래처 직원 편집 상태

```typescript
// 거래처 직원 추가/편집
const [showContactForm, setShowContactForm] = useState<boolean>(false);
const [editingContactId, setEditingContactId] = useState<number | null>(null);
const [newContact, setNewContact] = useState<Partial<PartnerContactResponse>>({
  name: '',
  position: '',
  department: '',
  phone: '',
  email: '',
});
const [loadingContact, setLoadingContact] = useState<boolean>(false);
```

### 상태 설명

- **partner**: 거래처 상세 정보 (API 응답)
- **contacts**: 거래처 직원 목록 (API 응답)
- **loading**: 로딩 상태 (조회, 수정, 삭제)
- **loadingContacts**: 직원 목록 로딩 상태
- **error**: 에러 메시지
- **isEditing**: 거래처 편집 모드 여부
- **showContactForm**: 직원 추가/편집 폼 표시 여부
- **editingContactId**: 편집 중인 직원 ID (null이면 추가 모드)
- **newContact**: 새로 추가하거나 편집할 직원 정보
- **loadingContact**: 직원 추가/수정/삭제 중 상태

## 데이터 흐름

### 초기 데이터 로딩

페이지 마운트 시 (`useEffect`):

1. URL 파라미터에서 거래처 ID 추출
2. 거래처 상세 정보 조회 (`getPartnerDetail`)
3. 거래처 직원 목록 조회 (`getPartnerContacts`)

두 API를 병렬로 호출 (`Promise.all`)

```typescript
useEffect(() => {
  if (!id) return;

  const loadPartner = async () => {
    setLoading(true);
    setError(null);
    try {
      const partnerId = parseInt(id, 10);
      const [partnerData, contactsData] = await Promise.all([
        getPartnerDetail(partnerId),
        getPartnerContacts(partnerId),
      ]);
      setPartner(partnerData);
      setContacts(contactsData);
    } catch (error: any) {
      // 에러 처리
    } finally {
      setLoading(false);
    }
  };

  loadPartner();
}, [id]);
```

### 편집 모드 상태 초기화

거래처 데이터를 편집 모드 상태로 복사 (`useEffect` with `partner` and `isEditing` dependencies):

```typescript
useEffect(() => {
  if (partner && isEditing) {
    setCompanyName(partner.companyName || '');
    setMainPhone(partner.mainPhone || '');
    setAddress(partner.address || '');
    setDescription(partner.description || '');
  }
}, [partner, isEditing]);
```

### 거래처 수정 저장 흐름

1. **폼 검증** (`handleSave`)
   - 회사명 비어있지 않은지 확인

2. **API 호출** (`updatePartner`)
   - `PartnerUpdateRequest` 객체 생성
   - 빈 문자열은 `null`로 변환

3. **성공 처리**
   - 거래처 데이터 업데이트
   - 편집 모드 종료 (`setIsEditing(false)`)

4. **에러 처리**
   - 에러 메시지를 Alert로 표시

### 거래처 삭제 흐름

1. **확인 다이얼로그** (`handleDelete`)
   - `window.confirm`으로 확인 요청

2. **API 호출** (`deletePartner`)
   - 거래처 삭제 API 호출

3. **성공 처리**
   - 거래처 목록 페이지로 이동 (`navigate('/partners')`)

4. **에러 처리**
   - 에러 메시지를 Alert로 표시

### 거래처 직원 추가 흐름

1. "직원 추가" 버튼 클릭 → `handleOpenContactForm()`
2. 직원 정보 입력
3. "추가" 버튼 클릭 → `handleSaveContact()`
4. 폼 검증 (이름 필수)
5. `POST /partners/{partnerId}/contacts` API 호출
6. 성공 시:
   - 직원 목록에 추가 (`setContacts([...contacts, createdContact])`)
   - 폼 닫기 및 초기화

### 거래처 직원 수정 흐름

1. 각 직원의 "수정" 버튼 클릭 → `handleEditContact(contact)`
2. 해당 직원 정보를 폼에 로드
3. 필드 수정
4. "수정" 버튼 클릭 → `handleSaveContact()`
5. 폼 검증 (이름 필수)
6. `PUT /partners/{partnerId}/contacts` API 호출
7. 성공 시:
   - 직원 목록 갱신 (`setContacts(contacts.map(...))`)
   - 폼 닫기 및 초기화

### 거래처 직원 삭제 흐름

1. 각 직원의 "삭제" 버튼 클릭 → `handleDeleteContact(contactId)`
2. 확인 다이얼로그 표시
3. 확인 시 `DELETE /partners/{partnerId}/contacts/{id}` API 호출
4. 성공 시:
   - 직원 목록에서 제거 (`setContacts(contacts.filter(...))`)

## 화면 갱신

### 읽기 모드

- 거래처 정보를 텍스트로 표시
- 거래처 직원 목록을 카드 그리드로 표시

### 편집 모드 전환

1. "수정" 버튼 클릭 → `setIsEditing(true)`
2. 거래처 데이터를 편집 모드 상태로 복사
3. 입력 필드로 전환

### 편집 모드

- 거래처 등록 페이지와 동일한 입력 폼
- 회사명: 텍스트 입력
- 대표 전화번호: 텍스트 입력
- 주소: 텍스트 입력
- 설명: 텍스트 영역

### 저장 후 갱신

- 거래처 데이터 업데이트
- 편집 모드 종료 → 읽기 모드로 전환
- 화면이 업데이트된 데이터로 갱신

### 취소 시

- 편집 모드 종료 (`setIsEditing(false)`)
- 원본 데이터로 상태 복원 (`handleCancel`)
- 읽기 모드로 전환

### 직원 추가/수정 후 갱신

- 직원 목록 상태 업데이트
- 폼 닫기 및 초기화
- 직원 목록 카드 자동 갱신

### 직원 삭제 후 갱신

- 직원 목록에서 해당 직원 제거
- 카드 그리드 자동 갱신

## 레이아웃 구조

```
PartnerDetailPage
├── 헤더
│   ├── 거래처 회사명
│   └── 액션 버튼
│       ├── "목록으로" 버튼
│       └── (ADMIN만)
│           ├── 읽기 모드: "수정", "삭제" 버튼
│           └── 편집 모드: "취소", "저장" 버튼
│
├── 에러 Alert (조건부)
│
├── 기본 정보 섹션 (카드)
│   ├── 회사명 (읽기: 텍스트 / 편집: 입력)
│   ├── 대표 전화번호 (읽기: 텍스트 / 편집: 입력)
│   ├── 주소 (읽기: 텍스트 / 편집: 입력)
│   └── 설명 (읽기: 텍스트 / 편집: 텍스트 영역)
│
└── 거래처 직원 섹션 (카드)
    ├── 헤더
    │   ├── 제목 ("거래처 직원 (N명)")
    │   └── "직원 추가" 버튼 (ADMIN만, showContactForm이 false일 때)
    │
    ├── 직원 추가/편집 폼 (showContactForm이 true일 때)
    │   ├── 이름 (필수)
    │   ├── 직급 (선택)
    │   ├── 부서 (선택)
    │   ├── 전화번호 (선택)
    │   ├── 이메일 (선택)
    │   └── 취소/저장 버튼
    │
    └── 직원 목록 (카드 그리드)
        └── 각 직원 카드
            ├── 아바타 + 이름 + 직급
            ├── 부서, 전화번호, 이메일
            └── (ADMIN만) 수정/삭제 버튼
```

## 상태 변경 흐름도

```
[초기 로딩]
  ↓
[거래처 데이터 조회]
  ↓
[거래처 직원 목록 조회]
  ↓
[읽기 모드 표시]
  ↓
[사용자 액션]
  ├─ [수정 버튼 클릭]
  │   ↓
  │   [편집 모드 진입]
  │   ↓
  │   [거래처 데이터 → 편집 상태 복사]
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
  │   │   [거래처 데이터 업데이트]
  │   │   ↓
  │   │   [읽기 모드로 전환]
  │   │
  │   └─ [취소 버튼 클릭]
  │       ↓
  │       [원본 데이터로 복원]
  │       ↓
  │       [읽기 모드로 전환]
  │
  ├─ [삭제 버튼 클릭]
  │   ↓
  │   [확인 다이얼로그]
  │   ↓
  │   [API 호출 (삭제)]
  │   ↓
  │   [거래처 목록 페이지로 이동]
  │
  ├─ [직원 추가 버튼 클릭]
  │   ↓
  │   [직원 추가 폼 표시]
  │   ↓
  │   [직원 정보 입력]
  │   ↓
  │   [추가 버튼 클릭]
  │   ↓
  │   [API 호출 (직원 추가)]
  │   ↓
  │   [직원 목록에 추가]
  │   ↓
  │   [폼 닫기]
  │
  ├─ [직원 수정 버튼 클릭]
  │   ↓
  │   [직원 편집 폼 표시]
  │   ↓
  │   [직원 정보 로드]
  │   ↓
  │   [필드 수정]
  │   ↓
  │   [수정 버튼 클릭]
  │   ↓
  │   [API 호출 (직원 수정)]
  │   ↓
  │   [직원 목록 갱신]
  │   ↓
  │   [폼 닫기]
  │
  └─ [직원 삭제 버튼 클릭]
      ↓
      [확인 다이얼로그]
      ↓
      [API 호출 (직원 삭제)]
      ↓
      [직원 목록에서 제거]
```

## 주요 컴포넌트

### Alert

- 에러 메시지 표시용
- `dismissible` prop으로 닫기 기능 제공

### 직원 카드

- 그리드 레이아웃으로 표시 (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)
- 각 카드에 아바타, 이름, 직급, 부서, 전화번호, 이메일 표시
- ADMIN 권한일 때만 수정/삭제 버튼 표시

## API 연동

### 사용 API

1. **거래처 상세 조회**
   - `getPartnerDetail()` from `frontend/src/api/partner.ts`
   - `GET /partners/{partnerId}`
   - 응답: `PartnerResponse`

2. **거래처 직원 목록 조회**
   - `getPartnerContacts()` from `frontend/src/api/partner.ts`
   - `GET /partners/{partnerId}/contacts`
   - 응답: `PartnerContactResponse[]`

3. **거래처 수정**
   - `updatePartner()` from `frontend/src/api/partner.ts`
   - `PUT /partners`
   - ADMIN 권한 필요
   - 요청 본문: `PartnerUpdateRequest`
   - 응답: `PartnerResponse`

4. **거래처 삭제**
   - `deletePartner()` from `frontend/src/api/partner.ts`
   - `DELETE /partners/{partnerId}`
   - ADMIN 권한 필요

5. **거래처 직원 추가**
   - `createPartnerContact()` from `frontend/src/api/partner.ts`
   - `POST /partners/{partnerId}/contacts`
   - ADMIN 권한 필요
   - 요청 본문: `PartnerContactCreateRequest`
   - 응답: `PartnerContactResponse`

6. **거래처 직원 수정**
   - `updatePartnerContact()` from `frontend/src/api/partner.ts`
   - `PUT /partners/{partnerId}/contacts`
   - ADMIN 권한 필요
   - 요청 본문: `PartnerContactUpdateRequest`
   - 응답: `PartnerContactResponse`

7. **거래처 직원 삭제**
   - `deletePartnerContact()` from `frontend/src/api/partner.ts`
   - `DELETE /partners/{partnerId}/contacts/{contactId}`
   - ADMIN 권한 필요

### 요청/응답 타입

```typescript
interface PartnerResponse {
  id: number;
  companyName: string;
  mainPhone: string | null;
  address: string | null;
  description: string | null;
}

interface PartnerUpdateRequest {
  id: number;
  companyName?: string | null;
  mainPhone?: string | null;
  address?: string | null;
  description?: string | null;
}

interface PartnerContactResponse {
  id: number;
  partnerId: number;
  name: string;
  position: string | null;
  department: string | null;
  phone: string | null;
  email: string | null;
}

interface PartnerContactCreateRequest {
  name: string; // 필수
  position?: string | null;
  department?: string | null;
  phone?: string | null;
  email?: string | null;
}

interface PartnerContactUpdateRequest {
  id: number;
  name?: string | null;
  position?: string | null;
  department?: string | null;
  phone?: string | null;
  email?: string | null;
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

- **회사명**: 비어있지 않아야 함 (`companyName.trim()`)
- **직원 이름**: 비어있지 않아야 함 (`newContact.name?.trim()`)

### 비즈니스 규칙

- 선택 필드들은 빈 문자열이면 `null`로 변환하여 전송
- 거래처 수정 시 모든 필드는 선택사항 (부분 업데이트 가능)

## 에러 처리

### 에러 유형

1. **거래처 조회 실패**
   - 404: "거래처를 찾을 수 없습니다."
   - 기타: "거래처 정보를 불러오는데 실패했습니다."

2. **거래처 수정 실패**
   - 서버 에러 (네트워크, 권한, 검증 등)
   - `error.response?.data?.message` 또는 기본 메시지 표시

3. **거래처 삭제 실패**
   - 서버 에러
   - `error.response?.data?.message` 또는 기본 메시지 표시

4. **거래처 직원 추가/수정/삭제 실패**
   - 서버 에러
   - `error.response?.data?.message` 또는 기본 메시지 표시

## 라우팅

- **경로**: `/partners/:id`
- **권한**: 인증된 사용자 (`ProtectedRoute`)
- **라우트 정의**: `frontend/src/App.tsx`

```typescript
<Route
  path="/partners/:id"
  element={
    <ProtectedRoute>
      <PartnerDetailPage />
    </ProtectedRoute>
  }
/>
```

## 유지보수 포인트

### 편집 모드 상태 관리

- 읽기 모드와 편집 모드 상태 분리
- 편집 모드 진입 시 원본 데이터 복사
- 취소 시 원본 데이터로 복원

### 직원 추가/편집 폼 공유

- `editingContactId`로 추가/수정 모드 구분
- `null`이면 추가 모드, 값이 있으면 수정 모드
- 같은 폼 컴포넌트를 재사용

### 직원 목록 상태 관리

- 서버 응답을 직접 상태로 관리
- 추가 시 배열에 추가
- 수정 시 `map`으로 해당 항목만 업데이트
- 삭제 시 `filter`로 해당 항목 제거

### 빈 문자열 처리

- 입력 필드의 빈 문자열을 `null`로 변환하여 서버 전송
- `value.trim() || null` 패턴 사용
- 서버에서 선택 필드로 처리

### 직원 카드 레이아웃

- 반응형 그리드 레이아웃 사용
- 모바일: 1열, 태블릿: 2열, 데스크톱: 3열
- 각 카드에 호버 효과 적용

## 참고 파일

- API 클라이언트: `frontend/src/api/partner.ts`
- 유사 페이지: `frontend/src/pages/ProjectDetailPage.tsx`
- 등록 페이지: `frontend/src/pages/PartnerCreatePage.tsx`

