locals {
  name           = "api"
  package        = jsondecode(file("${path.module}/../package.json"))
  app_name       = local.package.name
  app_version    = local.package.version
  app_image      = "ghcr.io/${local.package.author}/${local.package.name}:${local.package.version}"
  app_port       = 3000
  cluster_name   = "mypreflight"
  db_name        = "mypreflight"
  db_username    = "mypreflight"
  parameter_path = "/mypreflight/${local.name}"
  postcards_host = "https://postcards.mypreflight.io"
  account_id     = data.aws_caller_identity.current.account_id
  parameter_arn  = "arn:aws:ssm:${var.aws_region}:${local.account_id}:parameter"

  secret_values = {
    JWT_PRIVATE_KEY       = var.jwt_private_key
    JWT_PUBLIC_KEY        = var.jwt_public_key
    ADSB_API_TOKEN        = var.adsb_api_token
    SKYLINK_API_TOKEN     = var.skylink_api_token
    DISCORD_WEBHOOK_URL   = var.discord_webhook_url
    DISCORD_APP_TOKEN     = var.discord_app_token
    DISCORD_CLIENT_SECRET = var.discord_client_secret
    MAILGUN_API_KEY       = var.mailgun_api_key
  }

  secret_names = toset([
    "JWT_PRIVATE_KEY",
    "JWT_PUBLIC_KEY",
    "ADSB_API_TOKEN",
    "SKYLINK_API_TOKEN",
    "DISCORD_WEBHOOK_URL",
    "DISCORD_APP_TOKEN",
    "DISCORD_CLIENT_SECRET",
    "MAILGUN_API_KEY",
  ])

  functions = {
    AEROLOPA       = "aerolopa-provider"
    OSM            = "osm-provider"
    POSTCARD       = "postcard-generator"
    OCEANIC_TRACKS = "oceanic-tracks-provider"
  }

  environment = {
    NODE_ENV                                       = "production"
    SCHEDULER_ENABLED                              = "true"
    DISCORD_GATEWAY_ENABLED                        = "true"
    FRONTEND_BASE_URL                              = "https://app.mypreflight.io"
    ADSB_API_HOST                                  = "https://adsb.mypreflight.io"
    SKYLINK_API_HOST                               = "https://api.api-ninjas.com"
    SIMBRIEF_API_HOST                              = "https://www.simbrief.com"
    WEATHER_API_HOST                               = "https://aviationweather.gov"
    SAY_INTENTIONS_API_HOST                        = "https://portal.sayintentions.ai"
    MAILGUN_API_HOST                               = "https://api.eu.mailgun.net"
    MAILGUN_DOMAIN                                 = "mypreflight.io"
    MAIL_FROM_ADDRESS                              = "MyPreflight <no-reply@mypreflight.io>"
    GOOGLE_CLIENT_ID                               = "86975782904-rmclk0a65e08itnc0sqpfdlnkgih048o.apps.googleusercontent.com"
    DISCORD_CLIENT_ID                              = "1536756124894629970"
    DISCORD_SERVER_ID                              = "1398051941354963004"
    DISCORD_PUBLIC_FLIGHT_ANNOUNCEMENTS_CHANNEL_ID = "1454862005142818836"
    DISCORD_OAUTH_REDIRECT_URIS                    = "https://app.mypreflight.io/auth/discord/callback"
    AUTO_APPROVE_OPERATOR_ID                       = "13071893-ae78-4eb5-aafa-1d785a43a89e"
    POSTCARD_ART_BASE_URL                          = local.postcards_host
  }
}
