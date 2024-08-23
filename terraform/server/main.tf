terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "5.42.0"
    }
  }
}

data "google_project" "project" {}

resource "google_project_service" "run" {
  service = "run.googleapis.com"
}

resource "google_cloud_run_v2_service" "admin" {
  depends_on = [google_project_service.run]
  name       = "admin"
  location   = var.location
  ingress    = "INGRESS_TRAFFIC_ALL"

  template {
    containers {
      image = var.image

      env {
        name = "DATABASE_URL"
        value_source {
          secret_key_ref {
            secret  = "DATABASE_URL"
            version = "latest"
          }
        }
      }

      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }

      volume_mounts {
        name       = "env"
        mount_path = "/app/.env"
      }
    }

    scaling {
      min_instance_count = 1
      max_instance_count = 1
    }


    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [var.database_connection]
      }
    }

    volumes {
      name = "env"
      secret {
        secret = "ENV"

        items {
          version = "latest"
          path    = "."
          mode    = 0444
        }
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }
}

resource "google_cloud_run_domain_mapping" "admin" {
  name     = var.domain
  location = var.location

  metadata {
    namespace = var.project_id
  }

  spec {
    force_override = true
    route_name     = google_cloud_run_v2_service.admin.name
  }
}

resource "google_secret_manager_secret_iam_member" "database_password" {
  secret_id = "DATABASE_URL"
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${data.google_project.project.number}-compute@developer.gserviceaccount.com"
}

resource "google_secret_manager_secret_iam_member" "env" {
  secret_id = "ENV"
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${data.google_project.project.number}-compute@developer.gserviceaccount.com"
}

resource "google_cloud_run_v2_service_iam_binding" "public" {
  project  = var.project_id
  location = var.location
  name     = google_cloud_run_v2_service.admin.name
  role     = "roles/run.invoker"
  members  = ["allUsers"]
}
