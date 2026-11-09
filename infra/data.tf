data "aws_caller_identity" "current" {}

data "aws_ssm_parameter" "workload_boundary_arn" {
  name = "/mypreflight/bootstrap/workload-boundary-arn"
}

data "aws_ssm_parameter" "function_url" {
  for_each = local.functions

  name = "/mypreflight/${each.value}/url"
}
