variable "authorized_networks" {
  type = list(
    object({
      name  = string
      value = string
    })
  )

  default = []
}

variable "database_name" {
  type = string
}

variable "database_user" {
  type = string
}

variable "database_pass" {
  type = string
}

variable "region" {
  type = string
}
