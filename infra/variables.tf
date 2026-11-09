variable "aws_region" {
  type    = string
  default = "eu-central-1"
}

variable "log_retention_days" {
  type    = number
  default = 7
}

variable "desired_count" {
  description = "Running API tasks; 0 until the cutover"
  type        = number
  default     = 0

  validation {
    condition     = contains([0, 1], var.desired_count)
    error_message = "The API holds the Discord gateway and the scheduled jobs, so it runs at most one task."
  }
}

variable "fargate_cpu" {
  type    = string
  default = "256"
}

variable "fargate_memory" {
  type    = string
  default = "1024"
}

variable "cloudflared_image" {
  description = "cloudflare/cloudflared 2026.10.7, pinned by the digest of its multi-arch image index"
  type        = string
  default     = "cloudflare/cloudflared@sha256:4955524aeaa379e154023d5a027c250f7b35041a2e7e950cf13f144bc9b9c5ba"
}

variable "rds_instance_type" {
  type    = string
  default = "db.t4g.micro"
}

variable "migration_ingress_cidr" {
  description = "Address allowed to reach the database during the restore, as a /32; empty keeps it closed"
  type        = string
  default     = ""

  validation {
    condition     = var.migration_ingress_cidr == "" || can(cidrhost(var.migration_ingress_cidr, 0))
    error_message = "Use an address with its prefix, such as 203.0.113.7/32, or leave it empty."
  }
}

variable "alarm_email" {
  description = "Address that receives the alarm notifications"
  type        = string
}

variable "db_password" {
  type      = string
  sensitive = true
  ephemeral = true

  validation {
    condition     = length(var.db_password) >= 16
    error_message = "Set TF_VAR_db_password to at least 16 characters."
  }
}

variable "db_password_version" {
  type    = number
  default = 1
}

variable "app_secrets_version" {
  type    = number
  default = 1
}

variable "jwt_private_key" {
  type      = string
  sensitive = true
  ephemeral = true

  validation {
    condition     = length(var.jwt_private_key) > 0
    error_message = "Set TF_VAR_jwt_private_key."
  }
}

variable "jwt_public_key" {
  type      = string
  sensitive = true
  ephemeral = true

  validation {
    condition     = length(var.jwt_public_key) > 0
    error_message = "Set TF_VAR_jwt_public_key."
  }
}

variable "adsb_api_token" {
  type      = string
  sensitive = true
  ephemeral = true

  validation {
    condition     = length(var.adsb_api_token) > 0
    error_message = "Set TF_VAR_adsb_api_token."
  }
}

variable "skylink_api_token" {
  type      = string
  sensitive = true
  ephemeral = true

  validation {
    condition     = length(var.skylink_api_token) > 0
    error_message = "Set TF_VAR_skylink_api_token."
  }
}

variable "discord_webhook_url" {
  type      = string
  sensitive = true
  ephemeral = true

  validation {
    condition     = length(var.discord_webhook_url) > 0
    error_message = "Set TF_VAR_discord_webhook_url."
  }
}

variable "discord_app_token" {
  type      = string
  sensitive = true
  ephemeral = true

  validation {
    condition     = length(var.discord_app_token) > 0
    error_message = "Set TF_VAR_discord_app_token."
  }
}

variable "discord_client_secret" {
  type      = string
  sensitive = true
  ephemeral = true

  validation {
    condition     = length(var.discord_client_secret) > 0
    error_message = "Set TF_VAR_discord_client_secret."
  }
}

variable "mailgun_api_key" {
  type      = string
  sensitive = true
  ephemeral = true

  validation {
    condition     = length(var.mailgun_api_key) > 0
    error_message = "Set TF_VAR_mailgun_api_key."
  }
}

variable "cloudflare_tunnel_token" {
  type      = string
  sensitive = true
  ephemeral = true

  validation {
    condition     = length(var.cloudflare_tunnel_token) > 0
    error_message = "Set TF_VAR_cloudflare_tunnel_token."
  }
}
