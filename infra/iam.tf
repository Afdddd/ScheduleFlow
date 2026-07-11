# ────────────────────────────────────────────────
# IAM Role — EC2가 달고 다닐 "신분증"
# ────────────────────────────────────────────────

# Trust policy: "누가 이 Role을 쓸 수 있나" → EC2 서비스만
data "aws_iam_policy_document" "ec2_assume" {
  statement {
    actions = ["sts:AssumeRole"]   # "이 Role을 위임받는다"
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]   # EC2 서비스가 주체
    }
  }
}

resource "aws_iam_role" "ec2" {
  name               = "scheduleflow-ec2-role"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume.json  # 위 trust policy 연결

  tags = {
    Name = "scheduleflow-ec2-role"
  }
}

# ────────────────────────────────────────────────
# Permission: SSM Session Manager 접속 권한
#   AWS가 미리 만들어둔 관리형 정책(AmazonSSMManagedInstanceCore)을 붙임.
#   이게 있어야 SSH 없이 `aws ssm start-session`으로 서버 진입 가능.
# ────────────────────────────────────────────────
resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}


# S3 접근 — 특정 버킷만 허용 (최소권한 원칙)
#   AmazonS3FullAccess(모든 버킷)를 쓰지 않고, 앱 버킷 하나 + 필요한 액션만 허용.
#   EC2가 탈취돼도 피해 범위가 이 버킷으로 한정됨.
resource "aws_iam_policy" "s3_access" {
  name        = "scheduleflow-s3-access"
  description = "Allow EC2 to access the app's S3 bucket only"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket",
      ]
      Resource = [
        "arn:aws:s3:::${var.s3_bucket}",      # 버킷 자체 (ListBucket용)
        "arn:aws:s3:::${var.s3_bucket}/*",    # 버킷 안 객체 (Get/Put/Delete용)
      ]
    }]
  })
}

resource "aws_iam_role_policy_attachment" "s3" {
  role       = aws_iam_role.ec2.name
  policy_arn = aws_iam_policy.s3_access.arn
}

# ECR pull — EC2가 이미지를 내려받을 권한 (읽기 전용 관리형 정책)
#   GetAuthorizationToken(도커 로그인) + 이미지 레이어 다운로드만 허용. push는 불가.
resource "aws_iam_role_policy_attachment" "ecr_pull" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

resource "aws_iam_instance_profile" "ec2" {
  name = "scheduleflow-ec2-profile"
  role = aws_iam_role.ec2.name
}
