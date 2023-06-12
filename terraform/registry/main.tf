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
  env        = { for tuple in regexall("(.*?)=(.*)", file("../../.env")) : tuple[0] => sensitive(tuple[1]) }
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

module "secret_auth_client_secret" {
  source      = "./secret"
  secret_id   = "AUTH_CLIENT_SECRET"
  secret_data = local.env["AUTH_CLIENT_SECRET"]
  region      = local.region
}

module "secret_database_pass" {
  source      = "./secret"
  secret_id   = "DATABASE_PASS"
  secret_data = local.env["DATABASE_PASS"]
  region      = local.region
}

module "secret_directus_key" {
  source      = "./secret"
  secret_id   = "DIRECTUS_KEY"
  secret_data = local.env["DIRECTUS_KEY"]
  region      = local.region
}

module "secret_directus_secret" {
  source      = "./secret"
  secret_id   = "DIRECTUS_SECRET"
  secret_data = local.env["DIRECTUS_SECRET"]
  region      = local.region
}

module "secret_directus_admin_password" {
  source      = "./secret"
  secret_id   = "DIRECTUS_ADMIN_PASSWORD"
  secret_data = local.env["DIRECTUS_ADMIN_PASSWORD"]
  region      = local.region
}

module "secret_directus_admin_api_key" {
  source      = "./secret"
  secret_id   = "DIRECTUS_ADMIN_API_KEY"
  secret_data = local.env["DIRECTUS_ADMIN_API_KEY"]
  region      = local.region
}
