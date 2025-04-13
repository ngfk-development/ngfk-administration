terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "5.45.2"
    }
  }
}

resource "google_project_service" "sqladmin" {
  service = "sqladmin.googleapis.com"
}

resource "google_sql_database_instance" "instance" {
  depends_on = [google_project_service.sqladmin]

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

    database_flags {
      name  = "max_connections"
      value = 50
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
