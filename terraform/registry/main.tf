terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "5.42.0"
    }
  }
}

resource "google_project_service" "artifactregistry" {
  service = "artifactregistry.googleapis.com"
}

resource "google_artifact_registry_repository" "docker" {
  depends_on    = [google_project_service.artifactregistry]
  project       = var.project_id
  location      = var.region
  repository_id = "docker"
  format        = "DOCKER"
}
