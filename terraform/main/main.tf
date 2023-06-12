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

  docker_directus = var.docker_directus
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

  region = local.region
}

module "directus" {
  source = "./directus"

  project_id = local.project_id
  location   = local.region
  image      = local.docker_directus

  domain         = "admin.ngfk.dev"
  admin_email    = "admin@ngfk.dev"
  auth_client_id = "899041907578-2q7frtnl92sdhkj8915p880b0n1tt2cl.apps.googleusercontent.com"

  database_name       = local.env["DATABASE_NAME"]
  database_user       = local.env["DATABASE_USER"]
  database_connection = module.database.connection_name
  database_port       = "5432"

  storage_bucket = "${local.project_id}-directus"
}
