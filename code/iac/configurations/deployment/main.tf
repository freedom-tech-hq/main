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

resource "google_compute_instance" "vm" {
  name         = "docker-vm"
  machine_type = "e2-medium"
  zone         = "us-central1-a"

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2204-lts"
    }
  }

  network_interface {
    network = "default"
    access_config {} # Enables external IP
  }

  # Attach the service account to the VM to grant access to the bucket with implicit credentials
  service_account {
    email  = google_service_account.compute_sa.email
    scopes = ["cloud-platform"]
  }

  # Pass the bucket name to the VM as metadata
  metadata = {
    bucket_name = google_storage_bucket.user_files.name

    # TODO: Generalize the configuration
    # More ideas: https://stackoverflow.com/questions/38645002/how-to-add-an-ssh-key-to-an-gcp-instance-using-terraform
    ssh-keys = "pavel:${file("secrets/pavel.pub")}"
  }

  metadata_startup_script = file("${path.module}/init-vm.sh")

  tags = ["docker", "smtp"]
}

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

output "instance_ip" {
  value = google_compute_instance.vm.network_interface[0].access_config[0].nat_ip
}

output "bucket_name" {
  value = google_storage_bucket.user_files.name
}
