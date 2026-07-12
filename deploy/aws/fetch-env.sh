#!/bin/bash
# EC2에서 실행 — SSM Parameter Store에서 시크릿을 꺼내 .env 생성
# (비밀값은 코드/이미지/S3 어디에도 없고, 배포 시점에만 여기서 조립된다)
set -euo pipefail

REGION=ap-northeast-2
get() {
  aws ssm get-parameter --name "$1" --with-decryption \
    --query Parameter.Value --output text --region "$REGION"
}

# 값은 작은따옴표로 감싼다 — compose의 .env 파서가 따옴표 없는 값 안의
# $변수를 치환하고 #을 주석으로 잘라먹는다. 작은따옴표 = 문자 그대로.
cat > .env <<EOF
ECR=606531136262.dkr.ecr.ap-northeast-2.amazonaws.com
RDS_ENDPOINT=scheduleflow-db.cvyyww48csxn.ap-northeast-2.rds.amazonaws.com
MYSQL_USER=admin
MYSQL_PASSWORD='$(get /scheduleflow/prod/DB_PASSWORD)'
JWT_SECRET='$(get /scheduleflow/prod/JWT_SECRET)'
JWT_EXPIRATION=3600000
# 자동 로그인용 리프레시 토큰 만료(14일)
JWT_REFRESH_EXPIRATION=1209600000
# 도메인 연결됨(E단계) — Caddy가 이 도메인으로 Let's Encrypt 자동 HTTPS
SITE_ADDRESS=scheduleflow-app.duckdns.org
APP_CORS_ALLOWED_ORIGINS=https://scheduleflow-app.duckdns.org
# 첫 부팅 때 update로 스키마 생성 완료(2026-07-12) → 이후 validate 고정
DDL_AUTO=validate
EOF

chmod 600 .env
echo ".env 생성 완료 ($(grep -c = .env)개 변수)"
