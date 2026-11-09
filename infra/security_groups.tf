resource "aws_security_group" "task" {
  name   = "${local.app_name}-task"
  vpc_id = aws_vpc.main.id

  egress {
    description = "HTTPS to the providers, GitHub Container Registry and the AWS APIs"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "cloudflared tunnel to the Cloudflare edge over QUIC"
    from_port   = 7844
    to_port     = 7844
    protocol    = "udp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "cloudflared tunnel to the Cloudflare edge over HTTP/2"
    from_port   = 7844
    to_port     = 7844
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description     = "PostgreSQL to the database"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.rds.id]
  }

  tags = { Name = "${local.app_name}-task" }
}

resource "aws_security_group" "rds" {
  name   = "${local.cluster_name}-rds"
  vpc_id = aws_vpc.main.id

  tags = { Name = "${local.cluster_name}-rds" }
}

resource "aws_security_group_rule" "rds_ingress_task" {
  type                     = "ingress"
  description              = "PostgreSQL from the API task"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  security_group_id        = aws_security_group.rds.id
  source_security_group_id = aws_security_group.task.id
}

resource "aws_security_group_rule" "rds_ingress_migration" {
  count = var.migration_ingress_cidr == "" ? 0 : 1

  type              = "ingress"
  description       = "PostgreSQL from the restore, temporarily"
  from_port         = 5432
  to_port           = 5432
  protocol          = "tcp"
  cidr_blocks       = [var.migration_ingress_cidr]
  security_group_id = aws_security_group.rds.id
}
