resource "aws_db_subnet_group" "main" {
  name       = local.cluster_name
  subnet_ids = [aws_subnet.public_a.id, aws_subnet.public_b.id]

  tags = { Name = "${local.cluster_name}-db" }
}

resource "aws_db_instance" "postgres" {
  identifier            = local.cluster_name
  engine                = "postgres"
  engine_version        = "16"
  instance_class        = var.rds_instance_type
  allocated_storage     = 20
  max_allocated_storage = 50
  storage_type          = "gp3"
  storage_encrypted     = true
  deletion_protection   = true
  apply_immediately     = true

  db_name             = local.db_name
  username            = local.db_username
  password_wo         = var.db_password
  password_wo_version = var.db_password_version

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = var.migration_ingress_cidr != ""

  backup_retention_period   = 7
  copy_tags_to_snapshot     = true
  skip_final_snapshot       = false
  final_snapshot_identifier = "${local.cluster_name}-final"

  tags = { Name = local.cluster_name }
}
