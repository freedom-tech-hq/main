variable "env_name" {
  description = "Environment name (dev or prod)"
  type        = string
}

variable "gcp_project_id" {
  description = "GCP project ID"
  type        = string
}

variable "gcp_region" {
  description = "GCP region"
  type        = string
}

variable "dns_zone_name" {
  description = "Name of the DNS zone"
  type        = string
}

variable "dns_zone_dns_name" {
  description = "DNS name for the zone (must end with a period)"
  type        = string
}

variable "reverse_dns_zone_name" {
  description = "Name of the reverse DNS zone"
  type        = string
}

variable "reverse_dns_zone_dns_name" {
  description = "DNS name for the reverse DNS zone (must end with a period)"
  type        = string
}
