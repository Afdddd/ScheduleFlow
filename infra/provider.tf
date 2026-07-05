terraform {
    required_version = ">= 1.9"

    required_providers {
        aws = {
            source = "hashicorp/aws"
            version = "~> 5.0"
        }
    }
}

# 실제 AWS 접속 설정
provider "aws" {
  region = "ap-northeast-2"
  # 자격증명은 이미 `aws configure`로 설정된 ~/.aws/credentials 를 자동으로 읽어감.
}