# ────────────────────────────────────────────────
# EC2용 SG — 웹서버. 80/443만 개방, SSH(22)는 안 엶
# ────────────────────────────────────────────────
resource "aws_security_group" "web" {
  name        = "scheduleflow-web-sg"
  description = "EC2 web server: allow HTTP/HTTPS from anywhere"
  vpc_id      = aws_vpc.main.id   # 이 SG가 속할 VPC

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]   # 인터넷 전체 허용
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # SSH(22) 규칙 없음 = 차단. SSM Session Manager로 접속하므로 불필요.

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"            # -1 = 모든 프로토콜
    cidr_blocks = ["0.0.0.0/0"]   # 나가는 건 다 허용 (패키지 설치, ECR pull 등)
  }

  tags = {
    Name = "scheduleflow-web-sg"
  }
}

resource "aws_security_group" "db" {
  name = "scheduleflow-sg-db"
  description = "MySQL from web SG"
  vpc_id = aws_vpc.main.id

  ingress {
    description = "was"
    from_port = 3306
    to_port = 3306
    protocol = "tcp"
    security_groups = [aws_security_group.web.id]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"            # -1 = 모든 프로토콜
    cidr_blocks = ["0.0.0.0/0"]   # 나가는 건 다 허용 (패키지 설치, ECR pull 등)
  }

  tags = {
    Name = "scheduleflow-db-sg"
  }
}