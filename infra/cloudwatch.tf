# ════════════════════════════════════════════════════════════════
# CloudWatch — 로그 아카이브 + 메트릭 알람
#
# 역할 분담: Sentry = 예외 이벤트(조립된 스택트레이스), CloudWatch = Sentry가
# 못 보는 것(메모리/디스크/RDS, 앱이 죽어서 아무것도 못 보낼 때의 상황) + 로그 원문 아카이브.
# 둘은 서로 모르는 독립 평행 파이프라인.
#
# 이 파일은 [Layer 1] — 인스턴스를 건드리지 않는 것들만:
#   ① EC2 role에 CloudWatch Agent 권한 부여
#   ② 로그를 담을 log group (retention 필수)
# 에이전트 설치/config(Layer 2)와 SNS/알람(Layer 3)은 뒤에 붙인다.
# ════════════════════════════════════════════════════════════════

# ────────────────────────────────────────────────
# ① CloudWatch Agent 권한 — EC2 role에 관리형 정책 attach
#   PutMetricData(메모리/디스크 메트릭) + logs:PutLogEvents(로그 전송)
#   + ssm:GetParameter(Layer 2에서 config를 SSM Parameter Store에서 받아올 때) 포함.
#   에이전트도 그냥 API 클라이언트 — 크레덴셜은 인스턴스 프로파일(IMDS)에서 받음, 하드코딩 0.
# ────────────────────────────────────────────────
resource "aws_iam_role_policy_attachment" "cloudwatch_agent" {
  role       = aws_iam_role.ec2.name   # iam.tf 의 EC2 role 재사용
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

# ────────────────────────────────────────────────
# ② Log group — 컨테이너 로그(json-file)를 에이전트가 tail해서 여기로 보냄
#   컨테이너 json-file 경로가 컨테이너ID 기반이라 서비스별 분리가 불가 → 단일 그룹에 합침.
#   멀티라인(자바 스택트레이스) 깨짐은 허용 — 조립된 스택트레이스는 Sentry가 가지고 있고,
#   CloudWatch는 "아카이브 + OOM/죽음 감지"가 역할이라 원문 라인만 찾으면 충분.
#
#   retention 반드시 지정! 기본이 무기한이라 안 걸면 로그 저장비가 S3보다 나옴.
#   10명 트래픽 + 아카이브 용도 → 14일이면 사고 조사에 충분.
# ────────────────────────────────────────────────
resource "aws_cloudwatch_log_group" "docker" {
  name              = "/scheduleflow/docker"
  retention_in_days = 14

  tags = {
    Name = "scheduleflow-docker-logs"
  }
}
