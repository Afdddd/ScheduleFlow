# ────────────────────────────────────────────────
# ② AMI — 최초 생성 시점의 Amazon Linux 2023 (ARM64)에 고정
#   과거엔 data.aws_ami(most_recent=true)로 "최신"을 매번 찾았는데, 그러면
#   Amazon이 새 AMI를 낼 때마다 id가 바뀌어 apply 시 인스턴스 강제 재생성이 발동함
#   (AMI는 생성 후 못 바꾸는 속성 → in-place 불가 → destroy+create = 실사용자 다운타임).
#   그래서 지금 돌고 있는 AMI id로 명시 고정한다. 보안 업데이트는 박스 안 dnf로 처리.
#   새 AMI로 갈아탈 땐 아래 id를 의도적으로 바꿔서 계획된 재생성으로 진행.
#   (최신 AL2023 arm64 조회: aws ec2 describe-images --owners amazon
#     --filters "Name=name,Values=al2023-ami-*-arm64" --query
#     'sort_by(Images,&CreationDate)[-1].ImageId' --output text)
# ────────────────────────────────────────────────

# ────────────────────────────────────────────────
# ③ user-data — 부팅 시 1회 실행되는 초기화 스크립트
#   docker/compose 설치까지만. (앱 배포는 나중에 CI/CD 또는 수동)
#   heredoc(<<-EOF)으로 여러 줄 셸 스크립트를 그대로 넣음.
# ────────────────────────────────────────────────
# NOTE(#114): CloudWatch 에이전트는 이 user_data에 없음 — 라이브 인스턴스에
#   SSM Run Command로 무중단 설치했다(dnf install amazon-cloudwatch-agent +
#   fetch-config -c ssm:AmazonCloudWatch-scheduleflow-agent-config).
#   재생성된 새 박스엔 자동 설치가 안 되니, 재현성이 필요하면 그 두 줄을 아래 heredoc에
#   추가하거나 배포 스크립트로 옮길 것. (heredoc 안을 바꾸면 user_data가 변해 라이브
#   인스턴스 in-place 업데이트가 걸리니, 이 메모는 heredoc 밖에 둔다.)
locals {
  user_data = <<-EOF
    #!/bin/bash
    set -eux
    # 패키지 최신화 + docker 설치
    dnf update -y
    dnf install -y docker
    systemctl enable --now docker
    usermod -aG docker ec2-user            # ec2-user가 sudo 없이 docker 쓰게
    # docker compose 플러그인 설치
    mkdir -p /usr/local/lib/docker/cli-plugins
    curl -sSL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-aarch64 \
      -o /usr/local/lib/docker/cli-plugins/docker-compose
    chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
    # dnf update가 ssm-agent를 갱신하다 죽여도 마지막에 확실히 살려둔다
    # (SSM이 유일한 접속 경로라 이게 죽으면 서버에 못 들어감)
    dnf install -y amazon-ssm-agent
    systemctl enable amazon-ssm-agent
    systemctl restart amazon-ssm-agent
  EOF
}

# ────────────────────────────────────────────────
# ④ EC2 인스턴스 — 위 ①②③을 조립
# ────────────────────────────────────────────────
resource "aws_instance" "app" {
  ami           = "ami-03c1733c4f6df5149"      # ②에서 고정한 AL2023 arm64 (최초 생성분)
  instance_type = "t4g.micro"                  # ARM

  subnet_id                   = aws_subnet.public_a.id          # public subnet
  vpc_security_group_ids      = [aws_security_group.web.id]     # 80/443만 열린 web SG
  associate_public_ip_address = true                           # 인터넷에서 접근할 퍼블릭 IP

  iam_instance_profile = aws_iam_instance_profile.ec2.name      # ① 신분증 장착 (SSM+S3)
  user_data            = local.user_data                       # ③ 부팅 스크립트

  # key_name 없음! → SSH 키 안 씀. SSM Session Manager로 접속.

  root_block_device {
    volume_size = 30      # GB. 프리티어 30GB 한도
    volume_type = "gp3"
    encrypted   = true
  }

  tags = {
    Name = "scheduleflow-app"
  }
}

# ────────────────────────────────────────────────
# ⑤ EIP — 고정 퍼블릭 IP
#   인스턴스를 교체(재생성)해도 IP가 유지됨 → DuckDNS 재설정 불필요.
#   2024-02부터 일반 퍼블릭 IP도 동일 과금이라 EIP 추가 비용 없음.
# ────────────────────────────────────────────────
resource "aws_eip" "app" {
  instance = aws_instance.app.id
  domain   = "vpc"

  tags = {
    Name = "scheduleflow-eip"
  }
}
