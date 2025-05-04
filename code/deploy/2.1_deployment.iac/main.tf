provider "google" {
  project = "freedom-dev-454009"
  region  = "us-central1"
}

# Add random provider for generating unique names
provider "random" {}

# Define environment variable with a default value
variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "dev"
}

# Define local variables
locals {
  # IPs: https://docs.google.com/spreadsheets/d/17e-5nwrVJ55u-JOIm4LDL9at8fGGpc0MjAmWqIejgjs/edit
  api_server_ip = "82.26.157.248"
  smtp_outbound_ip = "82.26.157.248"
  smtp_hostname    = "smtp1.dev.linefeedr.com"
}

# Add PTR record for SMTP outbound IP
resource "google_dns_record_set" "smtp_ptr" {
  name = "248.157.26.82.in-addr.arpa."
  type = "PTR"
  ttl  = 300

  managed_zone = "rdns-82-26-157"

  rrdatas = ["${local.smtp_hostname}."]
}

# Generate a random suffix for the bucket name
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# Create a GCS bucket for user files with a unique name
resource "google_storage_bucket" "user_files" {
  name          = "user-files-${var.environment}-${random_id.bucket_suffix.hex}"
  location      = "us-central1"
  force_destroy = true

  uniform_bucket_level_access = true
}

# Create a service account for the compute instance
resource "google_service_account" "compute_sa" {
  account_id   = "compute-service-account"
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

# resource "google_compute_instance" "vm" {
#   name         = "docker-vm"
#   machine_type = "e2-medium"
#   zone         = "us-central1-a"
#
#   boot_disk {
#     initialize_params {
#       image = "ubuntu-os-cloud/ubuntu-2204-lts"
#     }
#   }
#
#   network_interface {
#     network = "default"
#     access_config {} # Enables external IP
#   }
#
#   # Attach the service account to the VM to grant access to the bucket with implicit credentials
#   service_account {
#     email  = google_service_account.compute_sa.email
#     scopes = ["cloud-platform"]
#   }
#
#   # Pass the bucket name to the VM as metadata
#   metadata = {
#     bucket_name = google_storage_bucket.user_files.name
#
#     # TODO: Generalize the configuration
#     # More ideas: https://stackoverflow.com/questions/38645002/how-to-add-an-ssh-key-to-an-gcp-instance-using-terraform
#     ssh-keys = "pavel:${file("../../secrets/pavel.pub")}"
#   }
#
#   metadata_startup_script = file("${path.module}/../../shared/init-docker-machine.sh")
#
#   tags = ["docker", "smtp"]
# }

# Firewall rule for SMTP
resource "google_compute_firewall" "smtp" {
  name    = "allow-smtp"
  network = "default"

  allow {
    protocol = "tcp"
    ports    = ["25"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["smtp"]
}

# output "instance_ip" {
#   value = google_compute_instance.vm.network_interface[0].access_config[0].nat_ip
# }

output "bucket_name" {
  value = google_storage_bucket.user_files.name
}

# Reference the existing dev DNS zone
data "google_dns_managed_zone" "dev_zone" {
  name = "dev-linefeedr-com"
}

# Define local variables for derivative domain names
locals {
  mail_domain = "mail-host.${data.google_dns_managed_zone.dev_zone.dns_name}"
  admin_email = "admin@mail-host.${data.google_dns_managed_zone.dev_zone.dns_name}"
}

# # Create a DNS A record for the VM
# resource "google_dns_record_set" "docker_vm" {
#   name         = local.mail_domain
#   managed_zone = data.google_dns_managed_zone.dev_zone.name
#   type         = "A"
#   ttl          = 300
#   rrdatas      = [google_compute_instance.vm.network_interface[0].access_config[0].nat_ip]
# }

# Create A record for the API endpoint
resource "google_dns_record_set" "api" {
  name         = "api.${data.google_dns_managed_zone.dev_zone.dns_name}"
  managed_zone = data.google_dns_managed_zone.dev_zone.name
  type         = "A"
  ttl          = 300
  rrdatas      = [local.api_server_ip]
}

# Create MX records for the mail-host subdomain
resource "google_dns_record_set" "mail_mx" {
  name         = local.mail_domain
  managed_zone = data.google_dns_managed_zone.dev_zone.name
  type         = "MX"
  ttl          = 300
  rrdatas      = ["10 ${local.smtp_hostname}."]
}

# Create SPF record to authorize the mail server to send emails
resource "google_dns_record_set" "spf_record" {
  name         = local.mail_domain
  managed_zone = data.google_dns_managed_zone.dev_zone.name
  type         = "TXT"
  ttl          = 300
  rrdatas      = [
    "\"v=spf1 ip4:${local.smtp_outbound_ip} ~all\""
  ]
}

# Create A record for the SMTP relay server
resource "google_dns_record_set" "smtp_relay" {
  name         = "smtp1.${data.google_dns_managed_zone.dev_zone.dns_name}"
  managed_zone = data.google_dns_managed_zone.dev_zone.name
  type         = "A"
  ttl          = 300
  rrdatas      = [local.smtp_outbound_ip]
}

# Create DMARC record for the mail domain
resource "google_dns_record_set" "dmarc_record" {
  name         = "_dmarc.${local.mail_domain}"
  managed_zone = data.google_dns_managed_zone.dev_zone.name
  type         = "TXT"
  ttl          = 300
  rrdatas      = [
    # Use https://dmarcguide.globalcyberalliance.org/dmarc to configure
    "\"v=DMARC1; p=none; rua=mailto:${local.admin_email}; ruf=mailto:${local.admin_email}; sp=reject; fo=1; aspf=s; adkim=s; ri=86400\""
  ]
}

# Create DKIM record for the mail domain
resource "google_dns_record_set" "dkim_record" {
  name         = "mail._domainkey.${local.mail_domain}"
  managed_zone = data.google_dns_managed_zone.dev_zone.name
  type         = "TXT"
  ttl          = 300

  rrdatas      = [
    # Inner \" are important because we need to create chunks less than 255 characters long
    # join() is imporant because othewise it creates 3 TXT records 1 part each instead of 1 record of 3 parts
    # space in join() is important to match the remote format and thus avoid seeing it always modified in 'apply'
    join(" ", [
      "\"v=DKIM1; h=sha256; k=rsa; \"",
      "\"p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAoJrvQPwzSvlM9wPL4Di1tGNzLVQZB/6jCy4EZoJ+M24fIEB6e/YThw2pn0YgrRl20EostZepsS/KFDFIYwp2CpbBSejjFXbDzzNdFWRAfOWTVrWh+aq3hUXiHbmt81VO9ABQ4EoX1mBhYMwsaSm+tg3gWOjhLXdKQn0Wjkzuw65m4KA4/gK2LWgnIw8zsmHhd77L4qmsPq+yNQ\"",
      "\"Te9IsMG8m0tTisXzNzzygRNjEg0V8w24BRQh0gQtVSeAdb7ioZlnQJDrj7FiFnggaSykbj52AhF9aYZOLk3nqUH1DrjT8Knti5LSoRBESApBodk9zR4JQ4sYGOCTsDXN9FYfdnTQIDAQAB\""
    ])
  ]
}

output "mail_domain" {
  value = local.mail_domain
}

output "smtp_relay_domain" {
  value = trimsuffix(google_dns_record_set.smtp_relay.name, ".")
}

output "api_server_domain" {
  value = trimsuffix(google_dns_record_set.api.name, ".")
}
