output "ec2_public_ip" {
  value = aws_eip.app.public_ip   # EIP = 고정 IP (인스턴스 교체돼도 유지)
}

output "ec2_instance_id" {
  value = aws_instance.app.id
}

output "rds_endpoint" {
  value = aws_db_instance.main.address
}