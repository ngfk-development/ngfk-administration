terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "4.51.0"
    }
  }
}

data "google_project" "project" {}

resource "google_project_service" "run" {
  service = "run.googleapis.com"
}

resource "google_storage_bucket" "directus_uploads" {
  name                        = var.storage_bucket
  location                    = var.location
  force_destroy               = true
  uniform_bucket_level_access = true
}

resource "google_cloud_run_v2_service" "directus" {
  depends_on = [google_project_service.run]
  name       = "directus"
  location   = var.location
  ingress    = "INGRESS_TRAFFIC_ALL"

  template {
    containers {
      image = var.image

      env {
        name  = "PUBLIC_URL"
        value = "https://${var.domain}/"
      }

      env {
        name = "KEY"
        value_source {
          secret_key_ref {
            secret  = "DIRECTUS_KEY"
            version = "latest"
          }
        }
      }

      env {
        name = "SECRET"
        value_source {
          secret_key_ref {
            secret  = "DIRECTUS_SECRET"
            version = "latest"
          }
        }
      }

      env {
        name  = "ADMIN_EMAIL"
        value = var.admin_email
      }

      env {
        name = "ADMIN_PASSWORD"
        value_source {
          secret_key_ref {
            secret  = "DIRECTUS_ADMIN_PASSWORD"
            version = "latest"
          }
        }
      }

      env {
        name = "ADMIN_API_KEY"
        value_source {
          secret_key_ref {
            secret  = "DIRECTUS_ADMIN_API_KEY"
            version = "latest"
          }
        }
      }

      env {
        name  = "AUTH_PROVIDERS"
        value = "google"
      }

      env {
        name  = "AUTH_GOOGLE_DRIVER"
        value = "openid"
      }

      env {
        name  = "AUTH_GOOGLE_CLIENT_ID"
        value = var.auth_client_id
      }

      env {
        name = "AUTH_GOOGLE_CLIENT_SECRET"
        value_source {
          secret_key_ref {
            secret  = "AUTH_CLIENT_SECRET"
            version = "latest"
          }
        }
      }

      env {
        name  = "AUTH_GOOGLE_ISSUER_URL"
        value = "https://accounts.google.com/.well-known/openid-configuration"
      }

      env {
        name  = "AUTH_GOOGLE_IDENTIFIER_KEY"
        value = "email"
      }

      env {
        name  = "AUTH_GOOGLE_ICON"
        value = "google"
      }

      env {
        name  = "AUTH_GOOGLE_LABEL"
        value = "Google"
      }

      env {
        name  = "DB_CLIENT"
        value = "postgres"
      }

      env {
        name  = "DB_HOST"
        value = "/cloudsql/${var.database_connection}"
      }

      env {
        name  = "DB_PORT"
        value = var.database_port
      }

      env {
        name  = "DB_DATABASE"
        value = var.database_name
      }

      env {
        name = "DB_PASSWORD"
        value_source {
          secret_key_ref {
            secret  = "DATABASE_PASS"
            version = "latest"
          }
        }
      }

      env {
        name  = "DB_USER"
        value = var.database_user
      }

      env {
        name  = "STORAGE_LOCATIONS"
        value = "google"
      }

      env {
        name  = "STORAGE_GOOGLE_DRIVER"
        value = "gcs"
      }

      env {
        name  = "STORAGE_GOOGLE_BUCKET"
        value = var.storage_bucket
      }

      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }
    }

    scaling {
      min_instance_count = 0
      max_instance_count = 1
    }


    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [var.database_connection]
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }
}

resource "google_cloud_run_domain_mapping" "directus" {
  name     = var.domain
  location = var.location

  metadata {
    namespace = var.project_id
  }

  spec {
    force_override = true
    route_name     = google_cloud_run_v2_service.directus.name
  }
}

resource "google_secret_manager_secret_iam_member" "auth_client_secret" {
  secret_id = "AUTH_CLIENT_SECRET"
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${data.google_project.project.number}-compute@developer.gserviceaccount.com"
}

resource "google_secret_manager_secret_iam_member" "database_password" {
  secret_id = "DATABASE_PASS"
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${data.google_project.project.number}-compute@developer.gserviceaccount.com"
}

resource "google_secret_manager_secret_iam_member" "directus_api_key" {
  secret_id = "DIRECTUS_ADMIN_API_KEY"
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${data.google_project.project.number}-compute@developer.gserviceaccount.com"
}

resource "google_secret_manager_secret_iam_member" "directus_admin_password" {
  secret_id = "DIRECTUS_ADMIN_PASSWORD"
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${data.google_project.project.number}-compute@developer.gserviceaccount.com"
}

resource "google_secret_manager_secret_iam_member" "directus_key" {
  secret_id = "DIRECTUS_KEY"
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${data.google_project.project.number}-compute@developer.gserviceaccount.com"
}

resource "google_secret_manager_secret_iam_member" "directus_secret" {
  secret_id = "DIRECTUS_SECRET"
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${data.google_project.project.number}-compute@developer.gserviceaccount.com"
}

resource "google_cloud_run_v2_service_iam_binding" "public" {
  project  = var.project_id
  location = var.location
  name     = google_cloud_run_v2_service.directus.name
  role     = "roles/run.invoker"
  members  = ["allUsers"]
}
