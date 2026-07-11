# ────────────────────────────────────────────────
# ECR — 도커 이미지 저장소 (backend/frontend 각 1개)
#   맥에서 arm64로 빌드해 push → EC2가 pull (같은 리전이라 전송비 0)
# ────────────────────────────────────────────────
resource "aws_ecr_repository" "backend" {
  name         = "scheduleflow-backend"
  force_delete = true   # destroy 시 이미지 있어도 삭제 (운영 안정화 후 재검토)

  tags = {
    Name = "scheduleflow-backend"
  }
}

resource "aws_ecr_repository" "frontend" {
  name         = "scheduleflow-frontend"
  force_delete = true

  tags = {
    Name = "scheduleflow-frontend"
  }
}

# 오래된 이미지 자동 정리 — 최근 5개만 유지 (스토리지 $0.10/GB/월 방지)
locals {
  ecr_keep_last_5 = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "keep last 5 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 5
      }
      action = { type = "expire" }
    }]
  })
}

resource "aws_ecr_lifecycle_policy" "backend" {
  repository = aws_ecr_repository.backend.name
  policy     = local.ecr_keep_last_5
}

resource "aws_ecr_lifecycle_policy" "frontend" {
  repository = aws_ecr_repository.frontend.name
  policy     = local.ecr_keep_last_5
}
