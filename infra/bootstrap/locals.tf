locals {
  account_id = data.aws_caller_identity.current.account_id
  iam_path   = "/bootstrap/"

  protect_bootstrap_statements = [
    {
      Sid    = "ProtectStateBucket"
      Effect = "Deny"
      Action = [
        "s3:DeleteBucket*",
        "s3:PutBucket*",
        "s3:PutEncryptionConfiguration",
        "s3:PutLifecycleConfiguration",
        "s3:PutReplicationConfiguration",
        "s3:DeleteObjectVersion*",
      ]
      Resource = [aws_s3_bucket.state.arn, "${aws_s3_bucket.state.arn}/*"]
    },
    {
      Sid      = "ProtectBootstrapState"
      Effect   = "Deny"
      Action   = ["s3:PutObject", "s3:DeleteObject"]
      Resource = "${aws_s3_bucket.state.arn}/bootstrap/*"
    },
    {
      Sid    = "ProtectStateKey"
      Effect = "Deny"
      Action = [
        "kms:ScheduleKeyDeletion",
        "kms:DisableKey",
        "kms:DisableKeyRotation",
        "kms:PutKeyPolicy",
        "kms:UpdateAlias",
        "kms:DeleteAlias",
      ]
      Resource = [aws_kms_key.state.arn, aws_kms_alias.state.arn]
    },
    {
      Sid      = "ProtectBudget"
      Effect   = "Deny"
      Action   = "budgets:ModifyBudget"
      Resource = aws_budgets_budget.monthly.arn
    },
  ]
}
