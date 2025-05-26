variable "env_name" {
  description = "Environment name (dev, john, staging, prod, etc.)"
  type        = string
}

# Project
variable "gcp_project_id" {
  description = "GCP project ID"
  type        = string
}

variable "gcp_region" {
  description = "GCP region for resources"
  type        = string
}

variable "gcp_service_account_id" {
  description = "GCP service account ID to access bucket"
  type        = string
}

# Network
variable "api_server_ip" {
  description = "IP address for the API server"
  type        = string
}

variable "smtp_outbound_ip" {
  description = "IP address for the SMTP outbound server"
  type        = string
}

variable "smtp_hostname" {
  description = "Hostname for the SMTP server"
  type        = string
}

variable "dns_zone_name" {
  description = "Name of the DNS managed zone"
  type        = string
}

variable "reverse_dns_zone_name" {
  description = "Name of the reverse DNS managed zone"
  type        = string
}

variable "frontend_cname_target" {
  description = "The target for the frontend CNAME record, from Firebase"
  type        = string
}

# Mail
variable "mail_domain" {
  description = "Mail domain"
  type        = string
}

variable "mail_dmarc" {
  description = "Part of DMARC record, specific for the environment. At least rua and ruf. Trailing ; is mandatory"
  type        = string
}

variable "mail_dkim_record" {
  description = "DKIM record"
  type        = list(string)
}
