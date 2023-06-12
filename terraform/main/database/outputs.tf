output "connection_name" {
  value       = google_sql_database_instance.instance.connection_name
  description = "The connection name of the instance to be used in connection strings. For example, when connecting with Cloud SQL Proxy."
}

output "ip_address" {
  value       = google_sql_database_instance.instance.public_ip_address
  description = "Public ipv4 address"
}
