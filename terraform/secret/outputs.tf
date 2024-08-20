output "secret_version_name" {
  value       = google_secret_manager_secret_version.secret_version.name
  description = "The resource name of the SecretVersion. Format: projects/{{project}}/secrets/{{secret_id}}/versions/{{version}}."
}
