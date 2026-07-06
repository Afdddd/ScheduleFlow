# ScheduleFlow 개편 설계 문서 (AWS 배포 + PWA 전환)

> 상태(2026-07-04): Phase 2(AWS 인프라) **Terraform으로 뼈대 구축·검증 완료 후 비용 절감 위해 destroy**(코드는 `infra/`에 보존, `terraform apply`로 15분 내 재현). 현재 우선순위는 **앱 작업(PWA 전환 + 기능 변경 + 모바일 화면)**. 앱이 무르익으면 인프라 부활 → 배포(§9 런북). 기존 서비스(Windows 온프렘)는 계속 운영 중이라 무중단·비급함.

## 1. 배경과 목표

ScheduleFlow는 **아버지 회사 내부에서 실제로 사용 중인 일정/프로젝트 관리 서비스**이자, 동시에 **이직용 포트폴리오**다. 이 두 성격이 모든 기술 선택의 기준이 된다.

- **실서비스 제약**: 사용자 약 10명(내부 직원), 6개월 후에도 ~10명으로 고정(성장 시나리오 없음). 실회사 데이터를 다루므로 **안정성·백업·보안·HTTPS가 실제 요구사항**이다.
- **포트폴리오 목표**: "대규모 스케일"이 아니라 **"실서비스를 정확히 right-sizing해서 저비용·안정적으로 운영한다"**는 역량을 보여준다 — IaC, 관측성, CI/CD, 보안.

### 설계 원칙
1. **Right-sizing**: 10명 규모에 ECS·ALB·오토스케일·읽기복제는 과설계. 의도적으로 배제한다.
2. **운영 품질 우선**: 규모 대신 자동백업·HTTPS·시크릿 관리·모니터링·알림으로 "운영 성숙도"를 증명한다.
3. **무중단 마이그레이션**: 실사용자가 있으므로 기존 서비스를 띄운 채 병행 구축 후 컷오버한다.
4. **비용 통제**: 첫 해 프리티어 활용, AWS Budgets 알람 필수.

---

## 2. 현재 상태 (As-Is)

| 블록 | 현재 구성 | 문제점 |
|---|---|---|
| 컴퓨트(backend) | Docker 이미지 (Spring Boot, Kotlin) | — |
| 프론트 | React 19 + **CRA(react-scripts 5)**, nginx 서빙 | CRA 유지보수 종료, PWA 미구현 |
| DB | **MySQL 컨테이너** (볼륨) | 백업/복구 체계 없음, 데이터 내구성 취약 |
| 트래픽 | nginx 리버스프록시 | — |
| 비밀값 | `.env` **평문 파일** | 시크릿 관리 부재 |
| 배포 | GitHub Actions → DockerHub → **self-hosted Windows 러너**에서 `docker compose up` | "서버"가 사실상 개인 윈도우 PC. 클라우드 아님 |
| 관측성 | Prometheus/Grafana/cAdvisor 등 로컬 구동 | 실서비스에 미연결 |

> PWA 자산은 일부 존재(`manifest.json`, `logo192/512`)하나 **서비스워커 등록이 없어** 실질적 PWA 아님.

---

## 3. 목표 아키텍처 (To-Be)

```
                          ┌─────────────────────────────────────┐
   사용자(브라우저/PWA) ──HTTPS──▶│  Route53(도메인) → ACM/Caddy(TLS)   │
                          │                                     │
                          │   ┌──────────── EC2 1대 ──────────┐  │
                          │   │  Caddy (자동 HTTPS, 리버스프록시) │  │
                          │   │     ├─▶ frontend(nginx, PWA)   │  │
                          │   │     └─▶ backend(Spring Boot)   │  │
                          │   │  docker-compose로 구동          │  │
                          │   └──────────────┬────────────────┘  │
                          │                  │ (private SG)       │
                          │          ┌───────▼────────┐           │
                          │          │ RDS MySQL       │  자동백업  │
                          │          │ (t4g.micro)     │           │
                          │          └────────────────┘           │
                          │   시크릿: SSM Parameter Store           │
                          │   관측성: CloudWatch + Prometheus/Grafana│
                          └─────────────────────────────────────┘
              인프라 전체: Terraform(IaC)  ·  배포: GitHub Actions → ECR → EC2
```

### 6블록 구성 결정

| 블록 | 선택 | 근거 |
|---|---|---|
| ① 컴퓨트 | **EC2 1대 + docker-compose** | 10명엔 1인스턴스로 충분. 리눅스/서버 운영 경험 어필 + 비용 최소(프리티어 t3.micro) |
| ② DB | **RDS MySQL t4g.micro, single-AZ** | 실데이터 → 자동백업·PITR 핵심. 컨테이너 DB 탈피 |
| ③ 정적+CDN | (1차) EC2의 nginx로 서빙 / (선택) **S3+CloudFront** | 10명엔 EC2 서빙으로 충분. CDN은 후순위 옵션 |
| ④ 트래픽/TLS | **Caddy** (EC2 내, 자동 Let's Encrypt) | ALB($18/월) 불필요. HTTPS 자동화 = PWA 필수조건 충족 |
| ⑤ 비밀값 | **SSM Parameter Store** (SecureString) | 무료. `.env` 평문 탈피, 배포 시 주입 |
| ⑥ IaC | **Terraform** | 작은 스택 = Terraform 입문 최적. 재현가능 인프라 어필 |
| ⑥ 관측성 | **기존 Prometheus/Grafana** + CloudWatch(메트릭/로그/알람) + **Budgets 알람** | "서비스 운영" 핵심 증거 |
| ⑥ 배포 | **GitHub Actions → ECR → EC2**(SSM 또는 SSH로 `compose pull && up`) | Windows self-hosted 러너 제거 |

### 네트워크/보안 설계
- **VPC**: public subnet에 EC2(퍼블릭 IP), private subnet에 RDS. NAT Gateway 불필요(→ $32/월 절약).
- **Security Group**:
  - EC2: 80/443만 외부 개방. **SSH(22)는 열지 않고 SSM Session Manager로 접속**(키 노출/포트 스캔 차단).
  - RDS: 3306을 **EC2의 SG에서만** 허용(인터넷 비공개).
- **TLS**: Caddy가 Let's Encrypt로 자동 발급·갱신.
- **시크릿**: SSM Parameter Store SecureString → 배포 시점에 환경변수로 주입. 리포지토리/이미지에 비밀값 미포함.

---

## 4. 비용 추정 (서울 ap-northeast-2)

| 항목 | 첫 1년(프리티어) | 이후 |
|---|---|---|
| EC2 (t3.micro→t4g.small) | $0 (750h 무료) | ~$8–15 |
| RDS (t4g.micro, 20GB) | $0 (750h 무료) | ~$13–15 |
| S3+CloudFront(선택) | ~$0–1 | ~$1–3 |
| Route53 | ~$0.5 + 도메인 | 동일 |
| SSM / CloudWatch(기본) | ~$0 | ~$0–2 |
| **합계** | **~$0–10/월** | **~$20–30/월** |

> ECS+ALB+NAT 노선($50–65/월) 대비 1/3 이하. **AWS Budgets에 $10~15 알람**을 1일차에 설정.
>
> ⚠️ **정정(2026-07-04)**: 계정 생성이 2023-11이라 **12개월 프리티어는 2024-11 만료**. 위 "첫 1년 $0" 열은 이 계정엔 해당 없음 — EC2/RDS 상시 과금(**월 ~$22**). 그래서 EC2·RDS는 **arm64(t4g)**로 통일(x86 대비 저렴), 도메인은 무료 서브도메인(DuckDNS). Budgets 알람은 배포 재개 시 **$25**로 상향. 개발 중엔 `terraform destroy`로 $0 유지.

---

## 5. 단계별 로드맵

### Phase 0 — 정리 (현 코드 기반, 즉시)
- [x] `Dockerfile` 빌드 깨짐 수정(루트 `build.gradle.kts`, `monitoring/build.gradle.kts` COPY 누락)
- [x] `docker-compose.yml` mysql 포트 3306→3307(로컬 충돌 회피)
- [ ] 위 수정 커밋
- [ ] **노출된 DockerHub 토큰 회전(재발급)** + `.env` 비밀값 점검

### Phase 1 — PWA 전환 (AWS와 독립, 먼저 가능)
- [ ] (권장) CRA → **Vite + vite-plugin-pwa** 마이그레이션 (대안: CRA 유지 + Workbox)
- [ ] 서비스워커 도입(앱셸/정적 캐싱, API 캐싱 전략)
- [ ] `manifest.json` 정비: `display: standalone`, theme/background color, **maskable 아이콘**, start_url
- [ ] iOS 메타태그(apple-touch-icon, apple-mobile-web-app-capable)
- [ ] 설치 프롬프트(beforeinstallprompt) UX
- [ ] HTTPS 환경에서 Lighthouse PWA 점검(설치 가능 여부 확인)

### Phase 2 — AWS 기반 구축 (Terraform, 기존 서비스 병행)
> 인프라 뼈대는 `infra/*.tf`로 구축·검증 완료 후 `terraform destroy`로 내림(비용 $0). 재개는 §9 런북.
- [x] AWS 계정/IAM 유저/Budgets 알람($10)/CLI 세팅
- [x] Terraform: VPC(public×1/private×2, IGW, 라우팅)
- [x] Terraform: Security Group(web 80/443, db 3306 from web SG only)
- [x] Terraform: RDS MySQL(t4g.micro, single-AZ, private, 자동백업 7일, 암호화) — apply 검증
- [x] Terraform: EC2(t4g.micro/**arm64**, AL2023) + IAM Role(SSM/S3 키리스) + user-data(docker/compose)
- [x] SSM Session Manager 접속 검증(SSH 미개방 상태에서 서버 진입 + docker 확인)
- [ ] ECR 리포 생성 + **arm64** 이미지 빌드/푸시
- [ ] SSM Parameter Store에 시크릿 등록(DB/JWT + S3_BUCKET/AWS_REGION)
- [ ] AWS용 `docker-compose.yml` 작성(mysql 컨테이너 제거→RDS, 이미지 ECR, nginx→Caddy)
- [ ] 무료 서브도메인(DuckDNS) → EC2 연결 + Caddy 자동 HTTPS
- [ ] 기존 MySQL → RDS 데이터 이전(mysqldump) — **이전 후 `skip_final_snapshot=false`로 변경**

### Phase 3 — 무중단 컷오버
- [ ] 새 환경에서 헬스체크·기능 검증(스테이징처럼)
- [ ] DNS를 새 EC2로 전환(낮은 TTL 후 스위치), 데이터 최종 동기화
- [ ] Windows self-hosted 러너 제거

### Phase 4 — CI/CD & 운영 고도화
- [ ] GitHub Actions OIDC로 AWS 인증(키 없는 배포) → ECR push → EC2 배포(SSM run-command/`compose pull && up`)
- [ ] CloudWatch 로그/메트릭 수집 + 알람(가용성, 디스크, 5xx)
- [ ] 기존 Prometheus/Grafana를 실서비스에 연결, 대시보드 정리
- [ ] RDS 백업 정책 확인, 복구 리허설 1회
- [ ] (선택) 프론트 S3+CloudFront 분리

---

## 6. 리스크 & 롤백

| 리스크 | 대응 |
|---|---|
| 실사용자 서비스 중단 | 병행 구축 후 DNS 컷오버. 문제 시 DNS를 구 환경으로 즉시 롤백 |
| 데이터 유실 | 컷오버 전 mysqldump 백업, RDS 자동백업 활성 확인, 복구 리허설 |
| 비용 폭탄 | Budgets 알람, NAT/ALB 미사용, 프리티어 한도 모니터링 |
| 시크릿 노출 | SSM SecureString, 리포/이미지에 비밀값 금지, 기존 토큰 회전 |
| PWA 미설치(요건 미충족) | HTTPS + manifest + SW 3요소 Lighthouse로 검증 |

---

## 7. 면접/이력서 talking points

- "사용자 10명 규모의 사내 실서비스를 **right-sizing**하여 월 $0–10로 운영 — 과설계를 피한 판단."
- "**Terraform(IaC)**로 VPC·EC2·RDS를 코드화, 재현 가능·리뷰 가능한 인프라 구성."
- "SSH 포트를 닫고 **SSM Session Manager**로 접속, 시크릿을 **Parameter Store**로 관리 — 보안 베스트프랙티스."
- "실데이터 대상 **RDS 자동백업 + 복구 리허설**, **무중단 DNS 컷오버**로 마이그레이션."
- "**Prometheus/Grafana + CloudWatch**로 가용성/리소스 모니터링·알림 운영."
- "레거시 **CRA → Vite + PWA** 전환으로 설치형 사내 앱 제공."

---

## 8. 다음 액션

인프라 뼈대(Phase 2 전반)는 Terraform으로 검증·박제 완료 후 destroy($0). **현재 우선순위는 앱 작업**:
1. 모바일 화면 명세 마무리
2. 부족한 기능 변경/추가
3. PWA 전환(Phase 1) — 서비스워커/manifest는 **localhost(HTTP)에서 개발·테스트 가능**(AWS 안 기다려도 됨)

앱이 무르익으면 → **§9 배포 런북**으로 인프라 부활 + 배포. 기존 Windows 온프렘 서비스는 그때까지 계속 운영.

---

## 9. 배포 재개 런북 (앱 완성 후 바로 실행)

> 전제: 앱(PWA+기능) 로컬 개발 완료. 인프라는 `infra/`에 코드로 보존됨(현재 destroy 상태). 브랜치/코드는 이미 검증됨.

### A. 인프라 부활
1. `cd infra && terraform apply` → VPC/SG/RDS/EC2/IAM 재생성(~15분)
2. `terraform output` 으로 EC2 퍼블릭 IP / RDS 엔드포인트 확인
3. Budgets 알람 $10 → **$25** 상향(실운영 비용 ~$22/월 반영)

### B. 시크릿 등록 (SSM Parameter Store)
- `DB_PASSWORD`, `JWT_SECRET`, `S3_BUCKET`, `AWS_REGION` 등을 **SecureString**으로 등록
- 앱은 배포 시점에 여기서 꺼내 환경변수 주입(코드/이미지에 비밀값 없음)

### C. 이미지 준비 (ECR)
1. ECR 리포 생성(`scheduleflow-backend`, `scheduleflow-frontend`) — Terraform 또는 CLI
2. 맥에서 **arm64**로 빌드(맥이 arm64라 네이티브) → ECR push. *t4g가 ARM이므로 arm64 필수*

### D. 배포 (SSM)
1. AWS용 `docker-compose.yml` 준비: mysql 컨테이너 제거(RDS 사용), 이미지 ECR 참조, `SPRING_DATASOURCE_URL`=RDS 엔드포인트, nginx→Caddy
2. SSM 접속 or Run Command → `docker compose pull && docker compose up -d`
3. `http://<퍼블릭IP>` 동작 확인 ← **첫 성공 마일스톤**

### E. 도메인 + HTTPS
1. DuckDNS 서브도메인 발급 → EC2 퍼블릭 IP 연결
2. Caddy가 해당 도메인으로 Let's Encrypt 자동 발급 → `https://xxx.duckdns.org`
3. 실기기에서 PWA 설치 검증(Lighthouse)

### F. 데이터 이전 + 컷오버 (Phase 3)
1. 기존 MySQL `mysqldump` → RDS import
2. ⚠️ 데이터 이전 후엔 `skip_final_snapshot = false`로 변경(destroy 시 백업 강제)
3. DNS 컷오버, Windows self-hosted 러너/노트북 은퇴

### 배포 방식(참고) — 회사 SSH 방식 대비
| | 회사(기존) | AWS(신규) |
|---|---|---|
| 서버 접속 | SSH(22) | **SSM**(포트 미개방) |
| 이미지 | DockerHub/`save·load` | **ECR**(같은 리전 pull 무료) |
| CI 인증 | 액세스 키 | **OIDC 키리스** |
- 첫 배포는 위 D를 손으로 검증 → 이후 **Phase 4**에서 GitHub Actions(OIDC)→ECR push→SSM Run Command로 자동화.
