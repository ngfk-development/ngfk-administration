terraform {
  required_version = ">= 0.12"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "5.45.2"
    }
  }

  backend "gcs" {}
}

locals {
  env        = { for tuple in regexall("(.*?)=(.*)", file("../.env")) : tuple[0] => sensitive(tuple[1]) }
  project_id = var.project_id
  region     = var.region
  zone       = "${var.region}-a"

  image        = var.image
  github_image = "ghcr.io/ngfk-development/${local.image}"
  gcp_image    = "${local.region}-docker.pkg.dev/${local.project_id}/docker/${local.image}"
}

provider "google" {
  project = local.project_id
  region  = local.region
  zone    = local.zone
}

module "artifactregistry" {
  source     = "./registry"
  project_id = local.project_id
  region     = local.region
}

resource "terraform_data" "push_image" {
  depends_on       = [module.artifactregistry]
  triggers_replace = [local.github_image, local.gcp_image]

  provisioner "local-exec" {
    command = <<EOT
      docker pull ${local.github_image}
      docker tag ${local.github_image} ${local.gcp_image}
      docker push ${local.gcp_image}
    EOT
  }
}

module "database" {
  source = "./database"

  authorized_networks = [
    { name = "Home", value = "31.20.112.229" }
  ]

  database_name = local.env["DATABASE_NAME"]
  database_user = local.env["DATABASE_USER"]
  database_pass = local.env["DATABASE_PASS"]

  region = local.region
}

module "secret_database_url" {
  source      = "./secret"
  secret_id   = "DATABASE_URL"
  secret_data = "postgres://${local.env["DATABASE_USER"]}:${local.env["DATABASE_PASS"]}@localhost/${local.env["DATABASE_NAME"]}?host=/cloudsql/${module.database.connection_name}"
  region      = local.region
}

module "secret_env" {
  source      = "./secret"
  secret_id   = "ENV"
  secret_data = file("../.env")
  region      = local.region
}

module "server" {
  depends_on = [terraform_data.push_image, module.secret_database_url, module.secret_env]
  source     = "./server"

  project_id          = local.project_id
  location            = local.region
  image               = local.gcp_image
  database_connection = module.database.connection_name

  domain = "admin.ngfk.dev"
}
