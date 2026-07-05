# ────────────────────────────────────────────────
# VPC — 내 전용 사설 네트워크 (모든 리소스의 바닥)
# ────────────────────────────────────────────────
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"  # 이 VPC가 쓸 IP 범위 (약 6.5만 개)
  enable_dns_hostnames = true           # RDS 등에 DNS 이름 붙게 함 (RDS 쓰려면 필요)
  enable_dns_support   = true           # VPC 내부 DNS 해석 켜기

  tags = {
    Name = "scheduleflow-vpc"           # AWS 콘솔에서 보일 이름표
  }
}

# ────────────────────────────────────────────────
# Public Subnet — EC2가 들어갈 곳 (인터넷 노출)
# ────────────────────────────────────────────────
resource "aws_subnet" "public_a" {
  vpc_id                  = aws_vpc.main.id   # 위 VPC 참조 → 이 안에 만들어짐
  cidr_block              = "10.0.1.0/24"     # VPC 범위 안의 작은 조각 (256개)
  availability_zone       = "ap-northeast-2a" # 어느 물리 데이터센터(AZ)에 둘지
  map_public_ip_on_launch = true              # 여기 뜨는 EC2에 퍼블릭 IP 자동 부여

  tags = {
    Name = "scheduleflow-public-a"
  }
}


resource "aws_subnet" "private_a" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = "ap-northeast-2a"

  tags = {
    Name = "scheduleflow-private-a"
  }
}

resource "aws_subnet" "private_b" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.12.0/24"
  availability_zone = "ap-northeast-2c"

  tags = {
    Name = "scheduleflow-private-b"
  }
}

resource "aws_internet_gateway" "internet_gateway" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "scheduleflow-internet-gateway"
  }
}

resource "aws_route_table" "route_table" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.internet_gateway.id
  }
}

resource "aws_route_table_association" "route_table_association" {
  subnet_id      = aws_subnet.public_a.id
  route_table_id = aws_route_table.route_table.id
}

# ────────────────────────────────────────────────
# Private 서브넷 전용 라우트 테이블
#   route 블록 없음 = local 경로만 존재(인터넷 경로 없음).
#   명시적으로 붙여서, 기본(main) 라우트 테이블에 나중에 IGW가 추가돼도
#   private 서브넷(RDS)이 인터넷에 노출되지 않게 격리.
# ────────────────────────────────────────────────
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "scheduleflow-private-rt"
  }
}

resource "aws_route_table_association" "private_a" {
  subnet_id      = aws_subnet.private_a.id
  route_table_id = aws_route_table.private.id
}

resource "aws_route_table_association" "private_b" {
  subnet_id      = aws_subnet.private_b.id
  route_table_id = aws_route_table.private.id
}
