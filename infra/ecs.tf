resource "aws_ecs_cluster" "main" {
  name = local.cluster_name

  setting {
    name  = "containerInsights"
    value = "disabled"
  }
}

resource "aws_cloudwatch_log_group" "app" {
  name              = "/ecs/${local.app_name}"
  retention_in_days = var.log_retention_days
}

resource "aws_ecs_task_definition" "app" {
  family                   = local.app_name
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.fargate_cpu
  memory                   = var.fargate_memory
  execution_role_arn       = aws_iam_role.execution.arn
  task_role_arn            = aws_iam_role.task.arn

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "ARM64"
  }

  volume {
    name = "tmp"
  }

  container_definitions = jsonencode([
    {
      name      = local.app_name
      image     = local.app_image
      essential = true

      readonlyRootFilesystem = true
      linuxParameters = {
        capabilities = { drop = ["ALL"] }
      }

      mountPoints = [{
        sourceVolume  = "tmp"
        containerPath = "/tmp"
        readOnly      = false
      }]

      healthCheck = {
        command     = ["CMD-SHELL", "curl -fsS -o /dev/null http://localhost:${local.app_port}/api || exit 1"]
        interval    = 10
        timeout     = 5
        retries     = 6
        startPeriod = 120
      }

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.app.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "app"
        }
      }

      environment = concat(
        [for name, value in local.environment : { name = name, value = value }],
        [for prefix, function in local.functions : {
          name  = "${prefix}_FUNCTION_BASE_URL"
          value = data.aws_ssm_parameter.function_url[prefix].insecure_value
        }],
      )

      secrets = concat(
        [for name in local.secret_names : { name = name, valueFrom = aws_ssm_parameter.secret[name].arn }],
        [{ name = "DATABASE_URL", valueFrom = aws_ssm_parameter.database_url.arn }],
        [for prefix, function in local.functions : {
          name      = "${prefix}_FUNCTION_SECRET"
          valueFrom = "${local.parameter_arn}/mypreflight/${function}/secret"
        }],
      )
    },
    {
      name      = "cloudflared"
      image     = var.cloudflared_image
      essential = true
      command   = ["tunnel", "--no-autoupdate", "--metrics", "localhost:20241", "--grace-period", "20s", "run"]

      readonlyRootFilesystem = true
      linuxParameters = {
        capabilities = { drop = ["ALL"] }
      }

      dependsOn = [{
        containerName = local.app_name
        condition     = "HEALTHY"
      }]

      healthCheck = {
        command     = ["CMD", "cloudflared", "tunnel", "--metrics", "localhost:20241", "ready"]
        interval    = 5
        timeout     = 2
        retries     = 6
        startPeriod = 10
      }

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.app.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "cloudflared"
        }
      }

      secrets = [
        { name = "TUNNEL_TOKEN", valueFrom = aws_ssm_parameter.cloudflare_tunnel_token.arn },
      ]
    },
  ])
}

resource "aws_ecs_service" "app" {
  name             = local.app_name
  cluster          = aws_ecs_cluster.main.id
  task_definition  = aws_ecs_task_definition.app.arn
  desired_count    = var.desired_count
  launch_type      = "FARGATE"
  platform_version = "LATEST"

  network_configuration {
    subnets          = [aws_subnet.public_a.id, aws_subnet.public_b.id]
    security_groups  = [aws_security_group.task.id]
    assign_public_ip = true
  }

  deployment_minimum_healthy_percent = 0
  deployment_maximum_percent         = 100

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  force_new_deployment = true
  triggers = {
    app_secrets_version = tostring(var.app_secrets_version)
    db_password_version = tostring(var.db_password_version)
  }

  wait_for_steady_state   = var.desired_count > 0
  propagate_tags          = "TASK_DEFINITION"
  enable_ecs_managed_tags = true

  depends_on = [aws_iam_role_policy.execution]
}
