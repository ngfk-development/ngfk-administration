terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "4.51.0"
    }
  }
}

module "secret_database_password" {
  source      = "../secret"
  region      = var.region
  secret_id   = "DATABASE_PASS"
  secret_data = var.database_pass
}

# data "google_secret_manager_secret_version" "database_password" {
#   secret = "DATABASE_PASSWORD"
# }

# resource "google_sql_database_instance" "instance" {
#   database_version    = "POSTGRES_15"
#   deletion_protection = true

#   settings {
#     tier = "db-f1-micro"

#     ip_configuration {
#       dynamic "authorized_networks" {
#         for_each = var.authorized_networks
#         iterator = network

#         content {
#           name  = network.value.name
#           value = network.value.value
#         }
#       }
#     }
#   }
# }

# resource "google_sql_database" "database" {
#   name     = var.database_name
#   instance = google_sql_database_instance.instance.name
# }

# resource "google_sql_user" "user" {
#   instance = google_sql_database_instance.instance.name
#   name     = var.database_user
#   password = data.google_secret_manager_secret_version.database_password.secret_data
# }
