# ────────────────────────────────────────────────
# GitHub Actions OIDC — 액세스 키 없이 배포 권한
#   GitHub이 워크플로마다 서명한 토큰을 제시하면 AWS가 검증 후
#   임시 자격증명을 발급. 장기 키를 GitHub 시크릿에 저장하지 않는다.
# ────────────────────────────────────────────────

# 1) OIDC 공급자 등록 — "GitHub의 토큰 서명을 신뢰한다"는 선언 (계정에 1개)
resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  # GitHub 루트 CA 지문 — AWS가 요즘은 자체 신뢰해서 사실상 형식 요건
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

# 2) Trust policy — "누가 이 Role을 쓸 수 있나"
#    우리 리포의 main 브랜치에서 도는 워크플로만 (PR/포크는 불가)
data "aws_iam_policy_document" "github_actions_assume" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]   # OIDC 토큰으로 위임받기
    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:Afdddd/ScheduleFlow:ref:refs/heads/main"]   # main 한정
    }
  }
}

resource "aws_iam_role" "github_actions" {
  name               = "scheduleflow-github-actions"
  assume_role_policy = data.aws_iam_policy_document.github_actions_assume.json

  tags = {
    Name = "scheduleflow-github-actions"
  }
}

# 3) Permission — 배포에 필요한 최소 권한만
#    (a) ECR 푸시: 우리 리포 2개만  (b) SSM 배포 명령: 우리 EC2 1대만
resource "aws_iam_policy" "github_actions_deploy" {
  name        = "scheduleflow-github-actions-deploy"
  description = "ECR push + SSM RunCommand for deploy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        # 도커 로그인 토큰 — 리소스 단위 제한 불가라 * 필수
        Effect   = "Allow"
        Action   = ["ecr:GetAuthorizationToken"]
        Resource = "*"
      },
      {
        # 이미지 push/pull — 우리 리포 2개 한정
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
          "ecr:PutImage",
          "ecr:BatchGetImage",
          "ecr:GetDownloadUrlForLayer",
        ]
        Resource = [
          "arn:aws:ecr:ap-northeast-2:606531136262:repository/scheduleflow-backend",
          "arn:aws:ecr:ap-northeast-2:606531136262:repository/scheduleflow-frontend",
        ]
      },
      {
        # 배포 명령 — 우리 EC2 1대 + 셸스크립트 문서만
        Effect = "Allow"
        Action = ["ssm:SendCommand"]
        Resource = [
          "arn:aws:ec2:ap-northeast-2:606531136262:instance/i-06558e1c30417fe0f",
          "arn:aws:ssm:ap-northeast-2::document/AWS-RunShellScript",
        ]
      },
      {
        # 명령 결과 조회 (배포 성공/실패 확인용)
        Effect   = "Allow"
        Action   = ["ssm:GetCommandInvocation"]
        Resource = "*"
      },
      {
        # 배포 번들(compose·Caddyfile·fetch-env.sh) 업로드 — deploy/ 경로만
        Effect = "Allow"
        Action = ["s3:PutObject", "s3:GetObject", "s3:ListBucket"]
        Resource = [
          "arn:aws:s3:::scheduleflow-files-606531136262",
          "arn:aws:s3:::scheduleflow-files-606531136262/deploy/*",
        ]
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "github_actions_deploy" {
  role       = aws_iam_role.github_actions.name
  policy_arn = aws_iam_policy.github_actions_deploy.arn
}

# 워크플로에 넣을 Role ARN 출력
output "github_actions_role_arn" {
  value = aws_iam_role.github_actions.arn
}