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

variable "repositories" {
  description = "GitHub repositories in the organization that deploy to this account; each name is also its state prefix and its IAM path"
  type        = set(string)
  default = [
    "api",
    "adsb-receiver-api",
    "aerolopa-provider",
    "osm-provider",
    "oceanic-tracks-provider",
    "postcard-generator",
  ]

  validation {
    condition     = !contains(var.repositories, "bootstrap")
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
