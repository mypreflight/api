output "state_bucket" {
  value = aws_s3_bucket.state.bucket
}

output "state_key_alias" {
  value = aws_kms_alias.state.name
}

output "workload_boundary_arn" {
  value = aws_iam_policy.workload_boundary.arn
}

output "deploy_role_arns" {
  value = { for repository, role in aws_iam_role.deploy : repository => role.arn }
}

output "plan_role_arns" {
  value = { for repository, role in aws_iam_role.plan : repository => role.arn }
}
