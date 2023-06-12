terraform {
  required_version = ">= 0.12"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "4.51.0"
    }
  }

  backend "gcs" {
    prefix = "registry"
  }
}

variable "project_id" {
  type = string
}

variable "region" {
  type = string
}

locals {
  project_id = var.project_id
  region     = var.region
  zone       = "${var.region}-a"
}

provider "google" {
  project = local.project_id
  region  = local.region
  zone    = local.zone
}

resource "google_project_service" "artifactregistry" {
  service = "artifactregistry.googleapis.com"
}

resource "google_artifact_registry_repository" "docker" {
  depends_on = [google_project_service.artifactregistry]

  project       = local.project_id
  location      = local.region
  repository_id = "docker"
  format        = "DOCKER"
}
