resource "aws_ssm_parameter" "secret" {
  for_each = local.secret_names

  name             = "${local.parameter_path}/${lower(replace(each.key, "_", "-"))}"
  type             = "SecureString"
  value_wo         = local.secret_values[each.key]
  value_wo_version = var.app_secrets_version
}

resource "aws_ssm_parameter" "cloudflare_tunnel_token" {
  name             = "${local.parameter_path}/cloudflare-tunnel-token"
  type             = "SecureString"
  value_wo         = var.cloudflare_tunnel_token
  value_wo_version = var.app_secrets_version
}

resource "aws_ssm_parameter" "database_url" {
  name             = "${local.parameter_path}/database-url"
  type             = "SecureString"
  value_wo         = "postgresql://${local.db_username}:${urlencode(var.db_password)}@${aws_db_instance.postgres.address}:${aws_db_instance.postgres.port}/${local.db_name}?schema=public&sslmode=verify-full&sslaccept=strict"
  value_wo_version = var.db_password_version
}

resource "aws_ssm_parameter" "vpc_id" {
  name  = "${local.parameter_path}/vpc-id"
  type  = "String"
  value = aws_vpc.main.id
}

resource "aws_ssm_parameter" "public_subnet_ids" {
  name  = "${local.parameter_path}/public-subnet-ids"
  type  = "StringList"
  value = join(",", [aws_subnet.public_a.id, aws_subnet.public_b.id])
}

resource "aws_ssm_parameter" "cluster_arn" {
  name  = "${local.parameter_path}/cluster-arn"
  type  = "String"
  value = aws_ecs_cluster.main.arn
}

resource "aws_ssm_parameter" "alarms_topic_arn" {
  name  = "${local.parameter_path}/alarms-topic-arn"
  type  = "String"
  value = aws_sns_topic.alarms.arn
}
