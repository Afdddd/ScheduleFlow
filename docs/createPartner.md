# 거래처/거래처 직원 등록 페이지 구현 문서

## 개요

거래처 등록 페이지(`PartnerCreatePage`)는 새로운 거래처를 생성하고, 성공 후 같은 페이지에서 거래처 직원(연락처)을 추가할 수 있는 2단계 등록 페이지입니다. ADMIN 권한이 필요하며, 거래처 기본 정보와 직원 정보를 입력받습니다.

## 파일 위치

- `frontend/src/pages/PartnerCreatePage.tsx`

## 주요 기능

1. **1단계: 거래처 기본 정보 입력**
   - 회사명 (필수)
   - 대표 전화번호 (선택)
   - 주소 (선택)
   - 설명 (선택)

2. **거래처 생성**
   - 폼 검증 후 API 호출
   - 성공 시 2단계로 전환

3. **2단계: 거래처 직원 추가**
   - 직원 정보 입력 (이름, 직급, 부서, 전화번호, 이메일)
   - 직원 추가 후 목록에 표시
   - 여러 명의 직원을 연속으로 추가 가능

## 상태 관리

### 상태 변수

```typescript
// 1단계: 거래처 정보
const [companyName, setCompanyName] = useState<string>('');
const [mainPhone, setMainPhone] = useState<string>('');
const [address, setAddress] = useState<string>('');
const [description, setDescription] = useState<string>('');

// 2단계: 거래처 직원
const [contacts, setContacts] = useState<PartnerContactResponse[]>([]);
const [showContactForm, setShowContactForm] = useState<boolean>(false);
const [newContact, setNewContact] = useState<Partial<LocalContact>>({
  name: '',
  position: '',
  department: '',
  phone: '',
  email: '',
});

// 거래처 생성 후 상태
const [createdPartnerId, setCreatedPartnerId] = useState<number | null>(null);

// 상태
const [loading, setLoading] = useState<boolean>(false);
const [loadingContact, setLoadingContact] = useState<boolean>(false);
const [error, setError] = useState<string | null>(null);
const [success, setSuccess] = useState<string | null>(null);
```

### 상태 설명

- **companyName**: 회사명
- **mainPhone**: 대표 전화번호
- **address**: 주소
- **description**: 설명
- **contacts**: 추가된 직원 목록 (서버 응답)
- **showContactForm**: 직원 추가 폼 표시 여부
- **newContact**: 새로 추가할 직원 정보
- **createdPartnerId**: 생성된 거래처 ID (2단계 전환용)
- **loading**: 거래처 생성 중 상태
- **loadingContact**: 직원 추가 중 상태
- **error**: 에러 메시지
- **success**: 성공 메시지

## 데이터 흐름

### 1단계: 거래처 생성

1. 사용자가 거래처 정보 입력
2. "거래처 등록" 버튼 클릭
3. 폼 검증 (회사명 필수)
4. `POST /partners` API 호출
5. 성공 시:
   - `createdPartnerId` 저장
   - 성공 메시지 표시
   - `showContactForm`을 `true`로 설정하여 2단계 폼 표시

```typescript
const handleCreatePartner = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  setSuccess(null);

  // 검증
  if (!companyName.trim()) {
    setError('회사명을 입력해주세요.');
    return;
  }

  setLoading(true);

  try {
    const partnerRequest: PartnerCreateRequest = {
      companyName: companyName.trim(),
      mainPhone: mainPhone.trim() || null,
      address: address.trim() || null,
      description: description.trim() || null,
    };

    const createdPartner = await createPartner(partnerRequest);
    setCreatedPartnerId(createdPartner.id);
    setSuccess('거래처가 성공적으로 등록되었습니다. 이제 직원을 추가할 수 있습니다.');
    setShowContactForm(true);
  } catch (error: any) {
    // 에러 처리
  } finally {
    setLoading(false);
  }
};
```

### 2단계: 거래처 직원 추가

1. 직원 정보 입력
2. "직원 추가" 버튼 클릭
3. 폼 검증 (이름 필수)
4. `POST /partners/{partnerId}/contacts` API 호출
5. 성공 시:
   - 직원 목록에 추가 (`setContacts([...contacts, createdContact])`)
   - 폼 초기화
   - 직원 추가 폼 닫기
   - 성공 메시지 표시

```typescript
const handleAddContact = async () => {
  if (!createdPartnerId) return;

  setError(null);

  // 검증
  if (!newContact.name?.trim()) {
    setError('이름을 입력해주세요.');
    return;
  }

  setLoadingContact(true);

  try {
    const contactRequest: PartnerContactCreateRequest = {
      name: newContact.name.trim(),
      position: newContact.position?.trim() || null,
      department: newContact.department?.trim() || null,
      phone: newContact.phone?.trim() || null,
      email: newContact.email?.trim() || null,
    };

    const createdContact = await createPartnerContact(createdPartnerId, contactRequest);
    setContacts([...contacts, createdContact]);
    // 폼 초기화 및 닫기
    setShowContactForm(false);
    setSuccess('직원이 성공적으로 추가되었습니다.');
  } catch (error: any) {
    // 에러 처리
  } finally {
    setLoadingContact(false);
  }
};
```

## 화면 갱신

### 1단계 → 2단계 전환

- 거래처 생성 성공 시 `createdPartnerId`가 설정됨
- 조건부 렌더링으로 1단계 폼 숨김, 2단계 섹션 표시
- 성공 메시지 표시

### 직원 추가 후 갱신

- 직원 추가 성공 시 `contacts` 배열에 새 직원 추가
- 직원 목록 카드가 자동으로 갱신됨
- 폼 초기화 및 닫기

### 사용자 입력에 따른 갱신

- 모든 입력 필드는 즉시 상태 업데이트
- 빈 문자열은 `null`로 변환하여 서버 전송

## 레이아웃 구조

```
PartnerCreatePage
├── 헤더
│   ├── 제목 ("거래처 등록")
│   └── "목록으로" 버튼
│
├── 에러/성공 Alert (조건부)
│
├── 1단계: 거래처 정보 입력 (createdPartnerId가 null일 때)
│   ├── 거래처 정보 섹션 (카드)
│   │   ├── 회사명 (필수)
│   │   ├── 대표 전화번호 (선택)
│   │   ├── 주소 (선택)
│   │   └── 설명 (선택)
│   │
│   └── 제출 버튼 영역
│       ├── 취소 버튼
│       └── 거래처 등록 버튼 (제출)
│
└── 2단계: 거래처 직원 추가 (createdPartnerId가 있을 때)
    ├── 추가된 직원 목록 (카드 그리드)
    │   └── 각 직원 카드: 아바타 + 이름 + 직급 + 부서 + 전화 + 이메일
    │
    ├── 직원 추가 폼 (showContactForm이 true일 때)
    │   ├── 이름 (필수)
    │   ├── 직급 (선택)
    │   ├── 부서 (선택)
    │   ├── 전화번호 (선택)
    │   ├── 이메일 (선택)
    │   └── 취소/추가 버튼
    │
    ├── 직원 관리 안내 (showContactForm이 false일 때)
    │   └── "직원 추가하기" 버튼
    │
    └── 완료 버튼
```

## 주요 컴포넌트

### Alert

- 에러 메시지 표시용 (`type="error"`)
- 성공 메시지 표시용 (`type="success"`)
- `dismissible` prop으로 닫기 기능 제공
- `onClose` 콜백으로 상태 초기화

### 직원 카드

- 그리드 레이아웃으로 표시 (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)
- 각 카드에 아바타, 이름, 직급, 부서, 전화번호, 이메일 표시
- 호버 효과 (`hover:shadow-md`)

## API 연동

### 사용 API

1. **거래처 생성**
   - `createPartner()` from `frontend/src/api/partner.ts`
   - `POST /partners`
   - ADMIN 권한 필요
   - 요청 본문: `PartnerCreateRequest`

2. **거래처 직원 생성**
   - `createPartnerContact()` from `frontend/src/api/partner.ts`
   - `POST /partners/{partnerId}/contacts`
   - ADMIN 권한 필요
   - 요청 본문: `PartnerContactCreateRequest`

### 요청/응답 타입

```typescript
interface PartnerCreateRequest {
  companyName: string; // 필수
  mainPhone?: string | null;
  address?: string | null;
  description?: string | null;
}

interface PartnerResponse {
  id: number;
  companyName: string;
  mainPhone: string | null;
  address: string | null;
  description: string | null;
}

interface PartnerContactCreateRequest {
  name: string; // 필수
  position?: string | null;
  department?: string | null;
  phone?: string | null;
  email?: string | null;
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
```

## 검증 규칙

### 필수 필드

- **회사명**: 비어있지 않아야 함 (`companyName.trim()`)
- **직원 이름**: 비어있지 않아야 함 (`newContact.name?.trim()`)

### 비즈니스 규칙

- 선택 필드들은 빈 문자열이면 `null`로 변환하여 전송
- 거래처 생성 후에만 직원 추가 가능
- 여러 명의 직원을 연속으로 추가 가능

## 에러 처리

### 에러 유형

1. **거래처 생성 실패**
   - 서버 에러 (네트워크, 권한, 검증 등)
   - `error.response?.data?.message` 또는 기본 메시지 표시
   - 1단계 폼 유지

2. **직원 추가 실패**
   - 서버 에러
   - `error.response?.data?.message` 또는 기본 메시지 표시
   - 직원 추가 폼 상태 유지

## 라우팅

- **경로**: `/partners/new`
- **권한**: ADMIN (`requireAdmin` prop)
- **라우트 정의**: `frontend/src/App.tsx`

```typescript
<Route
  path="/partners/new"
  element={
    <ProtectedRoute requireAdmin>
      <PartnerCreatePage />
    </ProtectedRoute>
  }
/>
```

## 유지보수 포인트

### 2단계 전환 로직

- `createdPartnerId` 상태로 1단계/2단계 구분
- 조건부 렌더링으로 단계별 UI 표시
- 거래처 생성 성공 시 자동으로 2단계로 전환

### 직원 목록 관리

- 서버 응답을 직접 상태로 관리 (`PartnerContactResponse[]`)
- 직원 추가 시 배열에 추가 (`setContacts([...contacts, createdContact])`)
- 직원 목록은 카드 그리드로 표시

### 폼 초기화

- 직원 추가 성공 시 폼 필드 초기화
- `setNewContact`로 모든 필드를 빈 문자열로 설정
- `setShowContactForm(false)`로 폼 닫기

### 빈 문자열 처리

- 입력 필드의 빈 문자열을 `null`로 변환하여 서버 전송
- `value.trim() || null` 패턴 사용
- 서버에서 선택 필드로 처리

## 참고 파일

- API 클라이언트: `frontend/src/api/partner.ts`
- 유사 페이지: `frontend/src/pages/ProjectCreatePage.tsx`
- 상세 페이지: `frontend/src/pages/PartnerDetailPage.tsx`

