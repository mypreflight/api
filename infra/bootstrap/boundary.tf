resource "aws_iam_policy" "workload_boundary" {
  name        = "workload-boundary"
  path        = local.iam_path
  description = "Permissions boundary on every role a repository creates for its own workloads"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = concat(
      [
        {
          Sid       = "AllowServicesExceptIam"
          Effect    = "Allow"
          NotAction = ["iam:*", "organizations:*", "account:*"]
          Resource  = "*"
        },
        {
          Sid      = "DenyStateBucket"
          Effect   = "Deny"
          Action   = "s3:*"
          Resource = [aws_s3_bucket.state.arn, "${aws_s3_bucket.state.arn}/*"]
        },
        {
          Sid      = "DenyStateKey"
          Effect   = "Deny"
          Action   = "kms:*"
          Resource = aws_kms_key.state.arn
        },
      ],
      local.protect_bootstrap_statements,
    )
  })
}

resource "aws_ssm_parameter" "workload_boundary_arn" {
  name  = "/mypreflight/bootstrap/workload-boundary-arn"
  type  = "String"
  value = aws_iam_policy.workload_boundary.arn
}
