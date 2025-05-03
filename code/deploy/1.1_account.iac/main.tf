provider "google" {
  project = "freedom-dev-454009"
  region  = "us-central1"
}

# Create a DNS zone for dev.linefeedr.com
resource "google_dns_managed_zone" "dev_linefeedr_com" {
  name     = "dev-linefeedr-com"
  dns_name = "dev.linefeedr.com."

  dnssec_config {
    state = "on"
  }
}

# TODO: The whole zone should be in the production account
# a sub-zone e.g. 82.26.157.128/25 should be manageable by the dev account if possible (not critical - every PTR be in production)
# Create a reverse DNS zone for 82.26.157.0/24
resource "google_dns_managed_zone" "rdns_82_26_157" {
  name        = "rdns-82-26-157"
  dns_name    = "157.26.82.in-addr.arpa."
  description = "Reverse DNS zone for 82.26.157.0/24"

  dnssec_config {
    state = "on"
  }
}

# Output the DNS zone name servers
output "dev_linefeedr_com_name_servers" {
  description = "Name servers for dev.linefeedr.com zone"
  value       = google_dns_managed_zone.dev_linefeedr_com.name_servers
}

# Output the reverse DNS zone name servers
output "rdns_82_26_157_name_servers" {
  description = "Name servers for 82.26.157.0/24 reverse DNS zone"
  value       = google_dns_managed_zone.rdns_82_26_157.name_servers
}
