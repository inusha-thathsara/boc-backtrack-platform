# Google Cloud Storage Buckets (Free Tier standard storage in us-central1)

# Raw Media Bucket for incoming client uploads
resource "google_storage_bucket" "raw_media" {
  name          = "${var.raw_bucket_name_prefix}-${var.project_id}-${random_id.bucket_suffix.hex}"
  location      = var.region
  storage_class = "STANDARD"

  uniform_bucket_level_access = true

  cors {
    origin          = ["*"]
    method          = ["GET", "PUT", "POST", "HEAD"]
    response_header = ["*"]
    max_age_seconds = 3600
  }

  lifecycle_rule {
    action {
      type = "Delete"
    }
    condition {
      age        = 7 # Retain raw uploads for 7 days before automated cleanup
      with_state = "ANY"
    }
  }

  labels = {
    environment = var.environment
    managed_by  = "terraform"
    service     = "backtrack-media"
  }

  depends_on = [google_project_service.required_services]
}

# Processed Media Bucket for HLS multi-bitrate streams (.m3u8, .ts) & thumbnails
resource "google_storage_bucket" "processed_media" {
  name          = "${var.processed_bucket_name_prefix}-${var.project_id}-${random_id.bucket_suffix.hex}"
  location      = var.region
  storage_class = "STANDARD"

  uniform_bucket_level_access = true

  cors {
    origin          = ["*"]
    method          = ["GET", "HEAD"]
    response_header = ["*"]
    max_age_seconds = 86400
  }

  # Auto-expire stories media after 24 hours (BOC 2.0 Scenario 2 core requirement)
  lifecycle_rule {
    action {
      type = "Delete"
    }
    condition {
      age                   = 1 # 1 day / 24 hours
      matches_prefix        = ["stories/"]
      with_state            = "ANY"
    }
  }

  labels = {
    environment = var.environment
    managed_by  = "terraform"
    service     = "backtrack-media"
  }

  depends_on = [google_project_service.required_services]
}

# Allow public read access to processed media bucket objects for CDN & direct delivery
resource "google_storage_bucket_iam_member" "public_processed_read" {
  bucket = google_storage_bucket.processed_media.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}
