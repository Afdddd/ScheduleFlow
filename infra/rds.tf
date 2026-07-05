# ────────────────────────────────────────────────
# DB Subnet Group — RDS를 어느 서브넷들에 둘지 지정
#   아까 만든 private subnet 2개(다른 AZ)를 묶음.
#   RDS는 single-AZ여도 2개 AZ의 서브넷을 요구(장애 대비 후보지).
# ────────────────────────────────────────────────
resource "aws_db_subnet_group" "main" {
  name       = "scheduleflow-db-subnet-group"
  subnet_ids = [aws_subnet.private_a.id, aws_subnet.private_b.id]

  tags = {
    Name = "scheduleflow-db-subnet-group"
  }
}

# ────────────────────────────────────────────────
# RDS MySQL 인스턴스
# ────────────────────────────────────────────────
resource "aws_db_instance" "main" {
  identifier     = "scheduleflow-db"     # AWS 상의 RDS 식별자
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = "db.t4g.micro"        # 프리티어(12개월 750h 무료), ARM 기반

  allocated_storage = 20                 # GB. 프리티어 한도 20GB
  storage_type      = "gp3"              # 최신 범용 SSD
  storage_encrypted = true               # 저장 데이터 암호화 (무료, 켜는 게 표준)

  db_name  = var.db_name                 # variables.tf → tfvars 에서 옴
  username = var.db_username
  password = var.db_password             # tfvars의 비밀값

  # 네트워크: private subnet에 두고, db SG만 붙임 → 인터넷 차단, EC2만 접근
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.db.id]
  publicly_accessible    = false         # 퍼블릭 IP 안 줌 (DB는 절대 인터넷 노출 X)
  multi_az               = false         # 10명 규모 → single-AZ (비용 절감, 의도적 right-sizing)

  # 백업
  backup_retention_period = 7            # 7일치 자동백업 보관 → PITR(특정시점복구) 가능
  backup_window           = "17:00-18:00" # UTC. 한국 새벽 2~3시 (트래픽 적을 때)

  # 운영 편의
  skip_final_snapshot = true             # destroy 시 마지막 스냅샷 생략(학습용). 실운영은 false 권장
  apply_immediately   = true             # 변경을 유지보수창 기다리지 말고 즉시 적용

  tags = {
    Name = "scheduleflow-db"
  }
}
