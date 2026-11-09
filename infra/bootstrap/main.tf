terraform {
  required_version = ">= 1.10.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  backend "s3" {
    bucket       = var.state_bucket_name
    key          = "bootstrap/terraform.tfstate"
    region       = var.aws_region
    use_lockfile = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project   = "mypreflight"
      Stack     = "bootstrap"
      ManagedBy = "opentofu"
    }
  }
}
