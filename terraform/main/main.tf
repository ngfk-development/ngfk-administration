terraform {
  required_version = ">= 0.12"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "4.51.0"
    }
  }

  backend "gcs" {
    prefix = "main"
  }
}

variable "project_id" {
  type = string
}

variable "region" {
  type = string
}

variable "docker_directus" {
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

module "database" {
  source = "./database"

  authorized_networks = [
    { name = "Home", value = "85.144.245.200" }
  ]

  database_name = local.env["DATABASE_NAME"]
  database_user = local.env["DATABASE_USER"]
  database_pass = local.env["DATABASE_PASS"]
}
