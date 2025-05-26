provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
}

# Add random provider for generating unique names
provider "random" {}

# Constants and calculated values
locals {
  # Calculate the PTR record format from the IP address
  smtp_outbound_ptr = "${split(".", var.smtp_outbound_ip)[3]}.${data.google_dns_managed_zone.reverse.dns_name}"
}

# Add PTR record for SMTP outbound IP
resource "google_dns_record_set" "smtp_ptr" {
  name = local.smtp_outbound_ptr
  type = "PTR"
  ttl  = 300

  managed_zone = var.reverse_dns_zone_name

  rrdatas = ["${var.smtp_hostname}."]
}

# Generate a random suffix for the bucket name
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# Create a GCS bucket for user files with a unique name
resource "google_storage_bucket" "user_files" {
  name          = "user-files-${var.env_name}-${random_id.bucket_suffix.hex}"
  location      = var.gcp_region
  force_destroy = true

  uniform_bucket_level_access = true
}

# Create a service account for the compute instance
resource "google_service_account" "compute_sa" {
  account_id   = var.gcp_service_account_id
  display_name = "Compute Service Account"
  description  = "Service account for compute resources"
}

# Grant Storage Object User role to allow the service account read/write access to the bucket
# This enables the VM to read from and write to objects in the user_files bucket
resource "google_storage_bucket_iam_member" "bucket_access" {
  bucket = google_storage_bucket.user_files.name
  role   = "roles/storage.objectUser"
  member = "serviceAccount:${google_service_account.compute_sa.email}"
}

output "bucket_name" {
  value = google_storage_bucket.user_files.name
}

# Reference the existing DNS zones
data "google_dns_managed_zone" "account" {
  name = var.dns_zone_name
}

data "google_dns_managed_zone" "reverse" {
  name = var.reverse_dns_zone_name
}

# Create A record for the API endpoint
resource "google_dns_record_set" "api" {
  name         = "api.${data.google_dns_managed_zone.account.dns_name}"
  managed_zone = data.google_dns_managed_zone.account.name
  type         = "A"
  ttl          = 300
  rrdatas      = [var.api_server_ip]
}

# Create MX records for the mail-host subdomain
resource "google_dns_record_set" "mail_mx" {
  name         = "${var.mail_domain}."
  managed_zone = data.google_dns_managed_zone.account.name
  type         = "MX"
  ttl          = 300
  rrdatas      = ["10 ${var.smtp_hostname}."]
}

# Create SPF record to authorize the mail server to send emails
resource "google_dns_record_set" "spf_record" {
  name         = "${var.mail_domain}."
  managed_zone = data.google_dns_managed_zone.account.name
  type         = "TXT"
  ttl          = 300
  rrdatas      = [
    "\"v=spf1 ip4:${var.smtp_outbound_ip} ~all\""
  ]
}

# Create A record for the SMTP relay server
resource "google_dns_record_set" "smtp_relay" {
  name         = "smtp1.${data.google_dns_managed_zone.account.dns_name}"
  managed_zone = data.google_dns_managed_zone.account.name
  type         = "A"
  ttl          = 300
  rrdatas      = [var.smtp_outbound_ip]
}

# Create DMARC record for the mail domain
resource "google_dns_record_set" "dmarc_record" {
  name         = "_dmarc.${var.mail_domain}."
  managed_zone = data.google_dns_managed_zone.account.name
  type         = "TXT"
  ttl          = 300
  rrdatas      = [
    # Use https://dmarcguide.globalcyberalliance.org/dmarc to configure
    "\"v=DMARC1; p=none; ${var.mail_dmarc} sp=reject; fo=1; aspf=s; adkim=s; ri=86400\""
  ]
}

# Create DKIM record for the mail domain
resource "google_dns_record_set" "dkim_record" {
  name         = "mail._domainkey.${var.mail_domain}."
  managed_zone = data.google_dns_managed_zone.account.name
  type         = "TXT"
  ttl          = 300
  rrdatas      = [
    # Inner \" are important because we need to create chunks less than 255 characters long
    # join() is imporant because othewise it creates 3 TXT records 1 part each instead of 1 record of 3 parts
    # space in join() is important to match the remote format and thus avoid seeing it always modified in 'apply'
    "\"${join("\" \"", var.mail_dkim_record)}\""
  ]
}

# Create CNAME record for the frontend app
resource "google_dns_record_set" "frontend" {
  name         = "app.${data.google_dns_managed_zone.account.dns_name}"
  managed_zone = data.google_dns_managed_zone.account.name
  type         = "CNAME"
  ttl          = 300
  rrdatas      = [var.frontend_cname_target]
}

output "smtp_relay_domain" {
  value = trimsuffix(google_dns_record_set.smtp_relay.name, ".")
}

output "api_server_domain" {
  value = trimsuffix(google_dns_record_set.api.name, ".")
}
