provider "google" {
  project = "freedom-dev-454009"
  region  = "us-central1"
}

# Reference the existing dev DNS zone
data "google_dns_managed_zone" "dev_zone" {
  name = "dev-linefeedr-com"
}
