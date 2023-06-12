terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "4.51.0"
    }
  }
}

resource "google_project_service" "sqladmin" {
  service = "sqladmin.googleapis.com"
}

resource "google_sql_database_instance" "instance" {
  database_version    = "POSTGRES_15"
  deletion_protection = true

  settings {
    tier = "db-f1-micro"

    ip_configuration {
      dynamic "authorized_networks" {
        for_each = var.authorized_networks
        iterator = network

        content {
          name  = network.value.name
          value = network.value.value
        }
      }
    }
  }
}

resource "google_sql_database" "database" {
  name     = var.database_name
  instance = google_sql_database_instance.instance.name
}

resource "google_sql_user" "user" {
  instance = google_sql_database_instance.instance.name
  name     = var.database_user
  password = var.database_pass
}
