# Eventarc Trigger: Dispatches GCS file upload events directly to Media Worker Cloud Run

resource "google_eventarc_trigger" "raw_upload_trigger" {
  name     = "backtrack-gcs-upload-trigger"
  location = var.region
  project  = var.project_id

  matching_criteria {
    attribute = "type"
    value     = "google.cloud.storage.object.v1.finalized"
  }

  matching_criteria {
    attribute = "bucket"
    value     = google_storage_bucket.raw_media.name
  }

  destination {
    cloud_run_service {
      service = google_cloud_run_service.media_worker.name
      region  = var.region
      path    = "/api/process-media"
    }
  }

  service_account = google_service_account.eventarc_sa.email

  depends_on = [
    google_project_service.required_services,
    google_cloud_run_service_iam_member.eventarc_invoker_worker
  ]
}

# Optional GCP Memorystore Redis (Provisioned ONLY if explicitly toggled by user)
# Base cost is ~$35/month; skipped by default for $0/mo Always Free Tier.
resource "google_redis_instance" "optional_memorystore" {
  count          = var.enable_paid_redis ? 1 : 0
  name           = "backtrack-cache-${var.environment}"
  tier           = "BASIC"
  memory_size_gb = 1
  region         = var.region
  project        = var.project_id

  authorized_network = "default"

  labels = {
    environment = var.environment
  }

  depends_on = [google_project_service.required_services]
}
