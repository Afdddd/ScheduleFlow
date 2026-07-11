# ────────────────────────────────────────────────
# ② AMI 자동 선택 — 최신 Amazon Linux 2023 (ARM64)
#   data 소스로 "최신 이미지"를 매번 찾아옴 → ID 하드코딩 안 함.
#   t4g/t3 계열에 맞춰 arm64 선택 (t4g=ARM, 저렴).
# ────────────────────────────────────────────────
data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]   # Amazon 공식 이미지만

  filter {
    name   = "name"
    values = ["al2023-ami-*-arm64"]   # Amazon Linux 2023, ARM64
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# ────────────────────────────────────────────────
# ③ user-data — 부팅 시 1회 실행되는 초기화 스크립트
#   docker/compose 설치까지만. (앱 배포는 나중에 CI/CD 또는 수동)
#   heredoc(<<-EOF)으로 여러 줄 셸 스크립트를 그대로 넣음.
# ────────────────────────────────────────────────
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
  ami           = data.aws_ami.al2023.id       # ②에서 찾은 최신 이미지
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
