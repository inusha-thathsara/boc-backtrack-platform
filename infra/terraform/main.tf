# Enable required Google Cloud APIs for BackTrack Platform
resource "google_project_service" "required_services" {
  for_each = toset([
    "run.googleapis.com",              # Cloud Run Serverless Containers
    "storage.googleapis.com",          # Google Cloud Storage (Media & HLS)
    "firestore.googleapis.com",        # Cloud Firestore NoSQL Database
    "vision.googleapis.com",           # Cloud Vision AI (Content Moderation)
    "eventarc.googleapis.com",         # Eventarc Event Bus (GCS Object Finalize)
    "artifactregistry.googleapis.com", # Artifact Registry Container Storage
    "logging.googleapis.com",          # Cloud Logging
    "monitoring.googleapis.com",       # Cloud Monitoring
    "cloudbuild.googleapis.com"        # Cloud Build (Automated Container Builds)
  ])

  project                    = var.project_id
  service                    = each.key
  disable_dependent_services = false
  disable_on_destroy         = false
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}
