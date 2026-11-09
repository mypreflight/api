variable "aws_region" {
  type    = string
  default = "eu-central-1"
}

variable "state_bucket_name" {
  type    = string
  default = "mypreflight-infra"
}

variable "github_organization" {
  type    = string
  default = "mypreflight"
}

variable "github_organization_id" {
  type    = number
  default = 318296465
}

variable "repositories" {
  description = "GitHub repositories in the organization that deploy to this account, by name and repository id; each name is also its state prefix and its IAM path"
  type        = map(number)
  default = {
    "api"                     = 898690054
    "adsb-receiver-api"       = 1014528017
    "aerolopa-provider"       = 1338728082
    "osm-provider"            = 1326413935
    "oceanic-tracks-provider" = 1444883527
    "postcard-generator"      = 1347654634
  }

  validation {
    condition     = !contains(keys(var.repositories), "bootstrap")
    error_message = "The name \"bootstrap\" is reserved for this stack's state prefix and IAM path."
  }
}

variable "alert_email" {
  description = "E-mail address that receives the budget alerts"
  type        = string
}

variable "monthly_budget_usd" {
  type    = number
  default = 60
}
