env_name = "dev" # dev, john, staging, prod, etc.

# GCP
gcp_project_id = "freedom-dev-123456"
gcp_region     = "us-central1"
gcp_service_account_id = "compute-service-account-dev"

# Network
# IP registry: https://docs.google.com/spreadsheets/d/17e-5nwrVJ55u-JOIm4LDL9at8fGGpc0MjAmWqIejgjs/edit
api_server_ip    = "82.26.157.999"
smtp_outbound_ip = "82.26.157.999"
smtp_hostname    = "smtp1.domain.com"
dns_zone_name    = "dev-domain-com"
reverse_dns_zone_name = "rdns-82-26-157"
frontend_cname_target = "something.web.app."

# Mail
mail_domain = "mail-host.dev.domain.com"
# In per-developer environments, use your real public email address. Trailing ; is mandatory
mail_dmarc = "rua=mailto:john@domain.com; ruf=mailto:john@domain.com;"

# Generate by code/backends/delivery-host/README.md
# Keep chunks exactly as in opendkim/keys/<domain.com>/mail.txt
mail_dkim_record = [
  "v=DKIM1; h=sha256; k=rsa; ",
  "p=MIIB...",
  "Te9I..."
]
