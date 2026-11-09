resource "aws_iam_role" "deploy" {
  for_each = var.repositories

  name = "${each.key}-deploy"
  path = local.iam_path

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Federated = aws_iam_openid_connect_provider.github.arn }
      Action    = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          "token.actions.githubusercontent.com:sub" = "repo:${var.github_organization}/${each.key}:environment:production"
        }
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "deploy_power_user" {
  for_each = var.repositories

  role       = aws_iam_role.deploy[each.key].name
  policy_arn = data.aws_iam_policy.power_user.arn
}

resource "aws_iam_role_policy" "deploy_iam" {
  for_each = var.repositories

  name = "iam-within-boundary"
  role = aws_iam_role.deploy[each.key].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "ReadIam"
        Effect   = "Allow"
        Action   = ["iam:Get*", "iam:List*"]
        Resource = "*"
      },
      {
        Sid    = "WriteRolesWithBoundary"
        Effect = "Allow"
        Action = [
          "iam:CreateRole",
          "iam:PutRolePermissionsBoundary",
          "iam:PutRolePolicy",
          "iam:DeleteRolePolicy",
          "iam:AttachRolePolicy",
          "iam:DetachRolePolicy",
        ]
        Resource  = "arn:aws:iam::${local.account_id}:role/${each.key}/*"
        Condition = { StringEquals = { "iam:PermissionsBoundary" = aws_iam_policy.workload_boundary.arn } }
      },
      {
        Sid    = "ManageOwnRoles"
        Effect = "Allow"
        Action = [
          "iam:DeleteRole",
          "iam:UpdateRole",
          "iam:UpdateRoleDescription",
          "iam:UpdateAssumeRolePolicy",
          "iam:TagRole",
          "iam:UntagRole",
          "iam:PassRole",
        ]
        Resource = "arn:aws:iam::${local.account_id}:role/${each.key}/*"
      },
      {
        Sid    = "ManageOwnPolicies"
        Effect = "Allow"
        Action = [
          "iam:CreatePolicy",
          "iam:DeletePolicy",
          "iam:CreatePolicyVersion",
          "iam:DeletePolicyVersion",
          "iam:SetDefaultPolicyVersion",
          "iam:TagPolicy",
          "iam:UntagPolicy",
        ]
        Resource = "arn:aws:iam::${local.account_id}:policy/${each.key}/*"
      },
    ]
  })
}

resource "aws_iam_role_policy" "deploy_protect_bootstrap" {
  for_each = var.repositories

  name = "protect-bootstrap"
  role = aws_iam_role.deploy[each.key].id

  policy = jsonencode({
    Version   = "2012-10-17"
    Statement = local.protect_bootstrap_statements
  })
}

resource "aws_iam_role" "plan" {
  for_each = var.repositories

  name = "${each.key}-plan"
  path = local.iam_path

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Federated = aws_iam_openid_connect_provider.github.arn }
      Action    = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          "token.actions.githubusercontent.com:sub" = "repo:${var.github_organization}/${each.key}:pull_request"
        }
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "plan_read_only" {
  for_each = var.repositories

  role       = aws_iam_role.plan[each.key].name
  policy_arn = data.aws_iam_policy.read_only.arn
}

resource "aws_iam_role_policy" "plan_state" {
  for_each = var.repositories

  name = "state-lock-and-key"
  role = aws_iam_role.plan[each.key].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "LockOwnState"
        Effect   = "Allow"
        Action   = ["s3:PutObject", "s3:DeleteObject"]
        Resource = "${aws_s3_bucket.state.arn}/${each.key}/*.tflock"
      },
      {
        Sid      = "UseStateKey"
        Effect   = "Allow"
        Action   = ["kms:Decrypt", "kms:GenerateDataKey"]
        Resource = aws_kms_key.state.arn
      },
    ]
  })
}
