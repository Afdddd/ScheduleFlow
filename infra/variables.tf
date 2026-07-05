# 변수 "선언" 파일 — 값은 여기 없음(terraform.tfvars에 넣음).
# 이 파일은 git에 올려도 안전(비밀값 없음).

variable "db_name" {
  description = "RDS에 만들 데이터베이스 이름"
  type        = string
  default     = "scheduleflow"   # default 있으면 tfvars에서 생략 가능
}

variable "db_username" {
  description = "RDS 마스터 사용자 이름"
  type        = string
  default     = "admin"
}

variable "db_password" {
  description = "RDS 마스터 비밀번호 (terraform.tfvars에만 넣기, git 금지)"
  type        = string
  sensitive   = true   #plan/apply 로그에 값이 '***'로 가려짐
}

variable "s3_bucket" {
  description = "앱이 사용하는 S3 버킷 이름 (EC2 IAM 정책의 접근 대상)"
  type        = string
  default     = "scheduleflow-files-606531136262"
}
