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

# ────────────────────────────────────────────────
# [Layer 2] 에이전트 config — SSM Parameter Store에 저장
#   에이전트가 부팅/설치 시 `-c ssm:<이름>`으로 이 값을 받아 기동한다.
#   config 실물은 cwagent-config.json (file()로 원문 주입 — templatefile이 아니라
#   ${aws:InstanceId} 같은 런타임 치환자를 Terraform이 안 건드리고 그대로 넘김).
#
#   ⚠ 이름을 반드시 "AmazonCloudWatch-"로 시작할 것.
#   Layer 1에서 붙인 CloudWatchAgentServerPolicy는 ssm:GetParameter를
#   Resource=parameter/AmazonCloudWatch-* 로만 허용한다. 다른 이름이면 에이전트가
#   config를 못 읽어 별도 IAM이 필요 → AWS가 정한 이 접두사를 그대로 따른다.
# ────────────────────────────────────────────────
resource "aws_ssm_parameter" "cwagent_config" {
  name  = "AmazonCloudWatch-scheduleflow-agent-config"
  type  = "String"
  value = file("${path.module}/cwagent-config.json")

  tags = {
    Name = "scheduleflow-cwagent-config"
  }
}

# ════════════════════════════════════════════════════════════════
# [Layer 3] SNS + 알람
#   알람은 "숫자가 임계값 넘었나"만 판단하고, 넘으면 액션으로 SNS ARN을 호출한다.
#   SNS는 CloudWatch가 아닌 별개 서비스 — 알람은 SNS든 Lambda든 상관 안 하고 ARN만 부름.
# ════════════════════════════════════════════════════════════════

# ── 알림 채널: SNS 토픽 + 이메일 구독 ──────────────
#   이메일 구독은 생성 직후 "PendingConfirmation" 상태 — AWS가 보낸 확인 메일의
#   링크를 클릭해야 실제로 알림이 온다. (apply만으론 활성화 안 됨)
resource "aws_sns_topic" "alarms" {
  name = "scheduleflow-alarms"
}

resource "aws_sns_topic_subscription" "alarms_email" {
  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

# ── 알람 ①: 메모리 ────────────────────────────────
#   정상 상태가 이미 ~80%(t4g.micro 1GB에 JVM 등 4프로세스)라, 85% 단발이면
#   GC 스파이크마다 울린다. 진짜 위험은 "지속적으로 90% 넘어 OOM으로 가는" 상황 →
#   5분 평균 × 3회 연속(=15분 지속)일 때만 발화하게 해서 잔진동을 걸러낸다.
resource "aws_cloudwatch_metric_alarm" "mem_high" {
  alarm_name        = "scheduleflow-mem-high"
  alarm_description = "메모리 사용률이 15분 이상 지속적으로 90%를 초과 (OOM 위험)"

  namespace   = "CWAgent"
  metric_name = "mem_used_percent"
  dimensions = {
    InstanceId = aws_instance.app.id
  }

  statistic           = "Average"
  period              = 300   # 5분
  evaluation_periods  = 3     # 3회 연속
  datapoints_to_alarm = 3
  comparison_operator = "GreaterThanOrEqualToThreshold"
  threshold           = 90
  treat_missing_data  = "missing" # 데이터 끊김(배포/재시작)은 알람 아님. 박스 통째 죽음은 내부 감시로 못 잡음(사용자 신고로 감지 — 10명 내부도구라 UptimeRobot 생략)

  alarm_actions = [aws_sns_topic.alarms.arn]
  ok_actions    = [aws_sns_topic.alarms.arn] # 복구됐을 때도 통지
}

# ── 알람 ②: 디스크(루트 볼륨) ─────────────────────
#   디스크는 로그/이미지 누적으로 천천히 차므로 지속 조건은 약하게(5분 × 2회).
#   85%면 여유 있을 때 손 쓰라는 신호. (uploads는 prod에서 S3라 로컬 디스크 부담 아님)
resource "aws_cloudwatch_metric_alarm" "disk_high" {
  alarm_name        = "scheduleflow-disk-high"
  alarm_description = "루트 볼륨 사용률이 85%를 초과 (로그/이미지 누적)"

  namespace   = "CWAgent"
  metric_name = "disk_used_percent"
  dimensions = {
    InstanceId = aws_instance.app.id
    path       = "/"
    device     = "nvme0n1p1" # 루트 파티션 (AL2023 arm64 nvme)
    fstype     = "xfs"
  }

  statistic           = "Average"
  period              = 300
  evaluation_periods  = 2
  datapoints_to_alarm = 2
  comparison_operator = "GreaterThanOrEqualToThreshold"
  threshold           = 85
  treat_missing_data  = "missing"

  alarm_actions = [aws_sns_topic.alarms.arn]
  ok_actions    = [aws_sns_topic.alarms.arn]
}

# ── 알람 ③: RDS 여유 스토리지 ─────────────────────
#   EC2 디스크만큼 조용한 살인마인데 Sentry 사각. managed라 공짜 메트릭.
#   할당 20GB 중 2GB 미만(=90% 사용) 남으면 발화. FreeStorageSpace는 "바이트" 단위.
resource "aws_cloudwatch_metric_alarm" "rds_storage_low" {
  alarm_name        = "scheduleflow-rds-storage-low"
  alarm_description = "RDS 여유 스토리지가 2GB 미만 (스토리지 고갈 임박)"

  namespace   = "AWS/RDS"
  metric_name = "FreeStorageSpace"
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  statistic           = "Average"
  period              = 300
  evaluation_periods  = 1
  comparison_operator = "LessThanThreshold"
  threshold           = 2147483648 # 2 GiB (2 * 1024^3 바이트)
  treat_missing_data  = "missing"

  alarm_actions = [aws_sns_topic.alarms.arn]
  ok_actions    = [aws_sns_topic.alarms.arn]
}

# ════════════════════════════════════════════════════════════════
# [Layer 4] 대시보드 — 한 판에 EC2 + RDS + 최근 에러 로그
#   콘솔 애드혹 조회 대신 "자주 같이 보는 지표"를 고정 배치. 상시무료 3개 중 1개(=$0).
#   그래프 위 점선 = 알람 임계선(annotations). InstanceId/RDS식별자는 리소스 참조.
#   레이아웃: 24열 그리드, 위젯당 높이 6. 1행 EC2 / 2행 RDS / 3행 로그.
# ════════════════════════════════════════════════════════════════
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "scheduleflow"

  dashboard_body = jsonencode({
    widgets = [
      # ── 1행: EC2 ──
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 8
        height = 6
        properties = {
          title   = "EC2 메모리 사용률 (%)"
          region  = "ap-northeast-2"
          stat    = "Average"
          period  = 300
          metrics = [["CWAgent", "mem_used_percent", "InstanceId", aws_instance.app.id]]
          yAxis   = { left = { min = 0, max = 100 } }
          annotations = {
            horizontal = [{ label = "알람 90%", value = 90 }]
          }
        }
      },
      {
        type   = "metric"
        x      = 8
        y      = 0
        width  = 8
        height = 6
        properties = {
          title  = "EC2 디스크 사용률 (%)"
          region = "ap-northeast-2"
          stat   = "Average"
          period = 300
          metrics = [[
            "CWAgent", "disk_used_percent",
            "InstanceId", aws_instance.app.id,
            "path", "/", "device", "nvme0n1p1", "fstype", "xfs"
          ]]
          yAxis = { left = { min = 0, max = 100 } }
          annotations = {
            horizontal = [{ label = "알람 85%", value = 85 }]
          }
        }
      },
      {
        type   = "metric"
        x      = 16
        y      = 0
        width  = 8
        height = 6
        properties = {
          title   = "EC2 CPU 사용률 (%)"
          region  = "ap-northeast-2"
          stat    = "Average"
          period  = 300
          metrics = [["AWS/EC2", "CPUUtilization", "InstanceId", aws_instance.app.id]]
          yAxis   = { left = { min = 0, max = 100 } }
        }
      },
      # ── 2행: RDS ──
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 8
        height = 6
        properties = {
          title   = "RDS 여유 스토리지 (bytes)"
          region  = "ap-northeast-2"
          stat    = "Average"
          period  = 300
          metrics = [["AWS/RDS", "FreeStorageSpace", "DBInstanceIdentifier", aws_db_instance.main.identifier]]
          annotations = {
            horizontal = [{ label = "알람 2GiB", value = 2147483648 }]
          }
        }
      },
      {
        type   = "metric"
        x      = 8
        y      = 6
        width  = 8
        height = 6
        properties = {
          title   = "RDS CPU 사용률 (%)"
          region  = "ap-northeast-2"
          stat    = "Average"
          period  = 300
          metrics = [["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", aws_db_instance.main.identifier]]
          yAxis   = { left = { min = 0, max = 100 } }
        }
      },
      {
        type   = "metric"
        x      = 16
        y      = 6
        width  = 8
        height = 6
        properties = {
          title   = "RDS 연결 수"
          region  = "ap-northeast-2"
          stat    = "Average"
          period  = 300
          metrics = [["AWS/RDS", "DatabaseConnections", "DBInstanceIdentifier", aws_db_instance.main.identifier]]
        }
      },
      # ── 3행: 로그 ──
      {
        type   = "log"
        x      = 0
        y      = 12
        width  = 24
        height = 6
        properties = {
          title  = "최근 에러 로그 (/scheduleflow/docker)"
          region = "ap-northeast-2"
          view   = "table"
          query  = "SOURCE '/scheduleflow/docker' | fields @timestamp, @message | filter @message like /ERROR/ | sort @timestamp desc | limit 50"
        }
      },
    ]
  })
}
