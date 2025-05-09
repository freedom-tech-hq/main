provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
}

# Create a DNS zone
resource "google_dns_managed_zone" "account" {
  name     = var.dns_zone_name
  dns_name = var.dns_zone_dns_name

  dnssec_config {
    state = "on"
  }
}

# Create a reverse DNS zone for our IPs
resource "google_dns_managed_zone" "reverse" {
  # TODO: a sub-zone e.g. 82.26.157.128/25 should be manageable by the dev account via CNAMEs block (not critical - every PTR be in production)

  name        = var.reverse_dns_zone_name
  dns_name    = var.reverse_dns_zone_dns_name
  description = "Reverse DNS zone for account IP-address range"

  dnssec_config {
    state = "on"
  }
}

# Add PTR record for SMTP outbound IP of dev server
# TODO: Set DNS-redirect and move to 2.1_deployment.iac
resource "google_dns_record_set" "smtp_ptr" {
  count = var.env_name == "prod" ? 1 : 0

  name = "248.157.26.82.in-addr.arpa."
  type = "PTR"
  ttl  = 300

  managed_zone = var.reverse_dns_zone_name

  rrdatas = ["smtp1.dev.linefeedr.com."]
}

# TODO: Align domain with dev-domain and move to 2.1_deployment.iac
resource "google_dns_record_set" "ddemo_www" {
  count = var.env_name == "prod" ? 1 : 0

  name = "ddemo.www.${var.dns_zone_dns_name}"
  type = "CNAME"
  ttl  = 300

  managed_zone = var.dns_zone_name

  rrdatas = ["ddemo-web-freedommail.web.app."]
}

# Redirect freedommail.me using Firebase
resource "google_dns_record_set" "freedommail_me_a" {
  count = var.env_name == "prod" ? 1 : 0

  name = "${var.dns_zone_dns_name}"
  type = "A"
  ttl  = 300

  managed_zone = var.dns_zone_name

  rrdatas = ["199.36.158.100"]
}

resource "google_dns_record_set" "www_freedommail_me_a" {
  count = var.env_name == "prod" ? 1 : 0

  name = "www.${var.dns_zone_dns_name}"
  type = "CNAME"
  ttl  = 300

  managed_zone = var.dns_zone_name

  rrdatas = ["freedommail-website.web.app."]
}

# Output the DNS zone name servers
output "account_dns_name_servers" {
  description = "Name servers for the account DNS zone"
  value       = google_dns_managed_zone.account.name_servers
}

# Output the reverse DNS zone name servers
output "reverse_dns_name_servers" {
  description = "Name servers for the account reverse DNS zone"
  value       = google_dns_managed_zone.reverse.name_servers
}
