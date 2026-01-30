# Docker Credential 문제 및 해결 방법

## 문제 상황

GitHub Actions의 self-hosted runner(Windows)에서 `docker pull` 실행 시 다음 에러 발생:

```
error getting credentials - err: exit status 1, out: `A specified logon session does not exist. It may already have been terminated.`
```

## 원인

### Windows Credential Manager와 서비스 컨텍스트 충돌

1. **Docker Desktop의 기본 설정**
   - Docker Desktop은 기본적으로 Windows Credential Manager(`wincred`)를 사용해 인증 정보를 저장
   - `~/.docker/config.json`에 `"credsStore": "wincred"` 설정이 있음

2. **Self-hosted Runner의 실행 환경**
   - GitHub Actions self-hosted runner는 Windows 서비스로 실행됨
   - 서비스는 `SYSTEM` 계정 또는 별도의 서비스 계정으로 실행됨
   - 이 계정은 사용자의 Windows Credential Manager에 접근 불가

3. **결과**
   - `docker login` 또는 `docker pull` 시 credential을 가져오려고 하지만
   - 서비스 컨텍스트에서는 사용자의 로그온 세션이 없어서 실패

```
┌─────────────────────────────────────────────────────────┐
│  GitHub Actions (self-hosted runner)                    │
│  └─ Windows Service (SYSTEM 계정)                       │
│      └─ docker pull                                     │
│          └─ wincred에서 credential 조회 시도            │
│              └─ ❌ 로그온 세션 없음 → 실패              │
└─────────────────────────────────────────────────────────┘
```

## 해결 방법

### Credential Helper 비활성화 + 직접 인증 정보 저장

`~/.docker/config.json`에서 `credsStore`를 제거하고, base64로 인코딩된 인증 정보를 직접 저장:

```json
{
  "auths": {
    "https://index.docker.io/v1/": {
      "auth": "base64로_인코딩된_username:password"
    }
  }
}
```

### 설정 방법 (PowerShell)

```powershell
# 1. username:password를 base64로 인코딩
$auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("username:password_or_token"))

# 2. config.json에 저장
'{"auths":{"https://index.docker.io/v1/":{"auth":"' + $auth + '"}}}' | Out-File "$env:USERPROFILE\.docker\config.json" -Encoding ASCII
```

### 동작 원리

```
┌─────────────────────────────────────────────────────────┐
│  GitHub Actions (self-hosted runner)                    │
│  └─ Windows Service (SYSTEM 계정)                       │
│      └─ docker pull                                     │
│          └─ config.json에서 auth 읽기                   │
│              └─ ✅ base64 디코딩 → 인증 성공            │
└─────────────────────────────────────────────────────────┘
```

## 대안 방법들

### 1. Docker Hub 이미지를 Public으로 설정
- 장점: 인증 자체가 불필요
- 단점: 이미지가 공개됨

### 2. SSH 배포 방식
- GitHub-hosted runner에서 SSH로 서버 접속 후 배포
- 장점: self-hosted runner 관리 불필요
- 단점: 서버가 공인 IP 또는 포트포워딩 필요 (Tailscale 등 VPN으로는 불가)

### 3. Runner를 서비스가 아닌 대화형으로 실행
- 사용자 로그온 세션에서 runner 실행
- 장점: wincred 정상 작동
- 단점: 사용자가 항상 로그인 상태여야 함

## 보안 주의사항

- `config.json`에 저장된 인증 정보는 base64 인코딩일 뿐 암호화가 아님
- 해당 파일에 대한 접근 권한 관리 필요
- Docker Hub Access Token 사용 권장 (비밀번호 대신)
- Access Token이 노출된 경우 즉시 재발급 필요

## 관련 파일

- `~/.docker/config.json`: Docker 인증 설정 파일
- `.github/workflows/deploy.yml`: GitHub Actions 배포 워크플로우