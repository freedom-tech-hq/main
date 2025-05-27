locals {
  test_bucket_name = "test-bucket-ihlxwyts"
}

resource "google_storage_bucket" "test_bucket" {
  name                        = local.test_bucket_name
  location                    = "US-CENTRAL1"
  force_destroy               = true

  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  soft_delete_policy {
    retention_duration_seconds = 0
  }
}

output "test_bucket_name" {
  description = "The name of the test bucket."
  value       = google_storage_bucket.test_bucket.name
}
