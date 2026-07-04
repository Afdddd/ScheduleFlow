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


resource "aws_iam_role_policy_attachment" "s3" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
}

resource "aws_iam_instance_profile" "ec2" {
  name = "scheduleflow-ec2-profile"
  role = aws_iam_role.ec2.name
}
