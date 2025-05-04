locals {
  # IPs: https://docs.google.com/spreadsheets/d/17e-5nwrVJ55u-JOIm4LDL9at8fGGpc0MjAmWqIejgjs/edit
  mock_smtp_server_ip  = "82.26.157.251"
  mock_smtp_hostname   = "mock-smtp.dev.linefeedr.com" # Also is a mail domain
}

# A record
resource "google_dns_record_set" "mock_smtp_a" {
  name         = "${local.mock_smtp_hostname}."
  managed_zone = data.google_dns_managed_zone.dev_zone.name
  type         = "A"
  ttl          = 300
  rrdatas      = [local.mock_smtp_server_ip]
}

# MX record
resource "google_dns_record_set" "mock_smtp_mx" {
  name         = "${local.mock_smtp_hostname}."
  managed_zone = data.google_dns_managed_zone.dev_zone.name
  type         = "MX"
  ttl          = 300
  rrdatas      = ["10 ${local.mock_smtp_hostname}."]
}

# SPF record - we do not send, but let's make the server look complete
resource "google_dns_record_set" "mock_smtp_spf" {
  name         = "${local.mock_smtp_hostname}."
  managed_zone = data.google_dns_managed_zone.dev_zone.name
  type         = "TXT"
  ttl          = 300
  rrdatas      = [
    "\"v=spf1 ip4:${local.mock_smtp_server_ip} -all\""
  ]
}

# Output the domain
output "mock_smtp_domain" {
  value = trimsuffix(google_dns_record_set.mock_smtp_a.name, ".")
}
