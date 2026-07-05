# ScheduleFlow

소규모 전장(PLC·하드웨어) 설계 회사를 위한 경량 ERP. 프로젝트·일정·거래처·파일을 한곳에서 관리한다.
실제 내부 도구로 운영 중이며(사용자 약 10명), 개인 포트폴리오를 겸한다.

개발 문서(Notion): https://inyeop.notion.site/ScheduleFlow-2960c52c1219803e8d40d3d313124b9f

## 주요 기능

- 대시보드 — 오늘/이번 주 일정, 담당 프로젝트, 팀원 현황을 한눈에
- 프로젝트 — 기간·상태·담당자·거래처 연동, 일정/파일 함께 관리
- 일정 — 프로젝트·시운전·배선 등 유형 구분, 리스트/캘린더 뷰
- 거래처 — 발주처·구매처와 담당자 연락처
- 파일 — 카테고리별(견적서·회로도·PLC·BOM·HMI·현장사진) 업로드, S3 저장
- 사원/권한 — 관리자/실무자 역할 기반 접근 제어
- 모바일 PWA — 홈 화면 설치, 오프라인 셸, 모바일 전용 화면

## 기술 스택

**백엔드**
- Kotlin 2.2.21, Spring Boot 4.0.0, Java 21
- Spring Security + JWT(jjwt), Spring Data JPA
- MySQL 8 (운영: RDS / 로컬: Docker / 테스트: H2)

**프론트엔드**
- React 19, TypeScript, Tailwind CSS
- React Router, Zustand, Axios, react-datepicker
- PWA (서비스 워커·매니페스트)

**인프라 / 운영**
- AWS EC2 단일 인스턴스 + Docker Compose
- Terraform으로 전체 인프라 코드화 (IaC)
- RDS MySQL, S3(파일 저장), nginx 리버스 프록시
- SSM Session Manager로 키리스 접근 (SSH 키 없이 운영)

## 아키텍처

```
사용자 ──▶ EC2 ── nginx ─┬─ frontend (React)
                         └─ backend  (Spring Boot) ──▶ RDS MySQL (private subnet)
                                       │
                                       └────────────▶ S3 (파일 저장)

Terraform: VPC(public/private subnet) · SG(web/db) · IAM(SSM·S3) · EC2 · RDS
```

- VPC를 public/private 서브넷으로 분리하고 RDS는 private에 배치
- EC2에 IAM Role을 부여해 S3·SSM에 키리스 접근 (액세스 키 미사용)
- Security Group으로 web/db 트래픽을 최소 권한으로 분리
- 시크릿은 환경변수로 주입하고 저장소에 커밋하지 않음

## 프로젝트 구조

```
backend/    Kotlin + Spring Boot API
frontend/   React PWA
infra/      Terraform (VPC·EC2·RDS·IAM·SG)
docker-compose.yml   배포 스택 (mysql · backend · frontend · nginx)
```

## 로컬 실행

```bash
# 백엔드
./gradlew :backend:bootRun

# 프론트엔드
cd frontend && npm install && npm start

# 또는 전체 스택 (필요한 환경변수 설정 후)
docker compose up -d
```

## 스크린샷

<!-- 실제 앱 스크린샷 추가 예정 -->

---

<details>
<summary>기획 · 기능 명세 (초기 설계 문서)</summary>

10인 미만의 PLC 및 하드웨어 전장 설계 회사에 특화된 경량 ERP 프로토타입 기획.
복잡한 기능보다는 '직관성'과 '파일/일정의 유기적 연동'이 핵심.

### 1. 기획 방향성

- **타겟:** 10인 미만 소규모 팀 (신속한 의사결정, 멀티태스킹 필요)
- **핵심 가치:** 어느 거래처의 무슨 장비(PLC) 프로젝트가 언제 마감이며, 맨먼스, 최신 도면/코드는 어디 있는가를 3초 안에 파악.

### 2. 메뉴 구조도 (Sitemap)

1. **대시보드 (Dashboard):** 전체 프로젝트 진행 현황 (캘린더)
2. **프로젝트 관리 (Project):** 핵심 업무 공간 (직원 할당, 파일, 일정)
3. **거래처 관리 (Partner):** 발주처 및 부품 구매처
4. **사원/권한 관리 (Admin):** 계정 및 접근 제어

### 3. 상세 기능 명세

#### A. 대시보드 (전체 프로젝트 확인)

- **기능:** 로그인 직후 모든 프로젝트 상태를 한눈에 파악
- **UI 구성:** 2분할 (캘린더 | 나에게 할당된 일 목록)
- **캘린더:** 모든 일정 표시, 프로젝트 일정 / 시운전 일정 구분
- **나에게 할당된 프로젝트 목록:** 진행 중 프로젝트, 마감일 임박 순 정렬
- **오늘 다른 팀원 상태 확인:** 팀원들의 오늘 일정/업무

#### B. 프로젝트 관리

- **기본 정보:** 프로젝트명, 발주처 연동, 기간(시작~마감), 상태(진행 중/보류/완료)
- **인원 할당:** 참여자 다수 선택 가능
- **관련 파일:** 카테고리 구분 — `견적서`, `회로도(DWG/PDF)`, `PLC 프로그램(Zip)`, `BOM`, `HMI 작화`

#### C. 거래처 관리 (Partner)

- 회사명, 대표자, 담당자 이름, 직통 연락처, 이메일

#### D. 사원 관리 (권한 설정)

| 권한 등급 | 명칭 | 기능 범위 |
| --- | --- | --- |
| **Level 1** | Admin (관리자) | 모든 프로젝트 생성/삭제, 사원 계정 관리, 데이터 백업 |
| **Level 2** | Staff (실무자) | 조회만 가능 |

</details>
