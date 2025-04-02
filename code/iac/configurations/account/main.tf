provider "google" {
  project = "freedom-dev-454009"
  region  = "us-central1"
}

# Create a DNS zone for dev.linefeedr.com
resource "google_dns_managed_zone" "dev_linefeedr_com" {
  name        = "dev-linefeedr-com"
  dns_name    = "dev.linefeedr.com."

  dnssec_config {
    state = "on"
  }
}

# Output the DNS zone name servers
output "dev_linefeedr_com_name_servers" {
  description = "Name servers for dev.linefeedr.com zone"
  value       = google_dns_managed_zone.dev_linefeedr_com.name_servers
}
