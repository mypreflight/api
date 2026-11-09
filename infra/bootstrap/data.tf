data "aws_caller_identity" "current" {}

data "aws_iam_policy" "power_user" {
  name = "PowerUserAccess"
}

data "aws_iam_policy" "read_only" {
  name = "ReadOnlyAccess"
}
