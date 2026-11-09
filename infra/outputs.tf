output "database_address" {
  value = aws_db_instance.postgres.address
}

output "cluster_name" {
  value = aws_ecs_cluster.main.name
}

output "service_name" {
  value = aws_ecs_service.app.name
}

output "app_image" {
  value = local.app_image
}
