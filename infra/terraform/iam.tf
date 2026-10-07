# Dedicated Service Accounts for Least-Privilege Execution

# 1. Feed API Service Account
resource "google_service_account" "feed_api_sa" {
  account_id   = "backtrack-feed-api-sa"
  display_name = "BackTrack Feed API Service Account"
  project      = var.project_id
}

resource "google_project_iam_member" "feed_api_firestore" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.feed_api_sa.email}"
}

resource "google_project_iam_member" "feed_api_storage" {
  project = var.project_id
  role    = "roles/storage.objectAdmin"
  member  = "serviceAccount:${google_service_account.feed_api_sa.email}"
}

# 2. Media Worker Service Account
resource "google_service_account" "media_worker_sa" {
  account_id   = "backtrack-media-worker-sa"
  display_name = "BackTrack Media Worker Service Account"
  project      = var.project_id
}

resource "google_project_iam_member" "media_worker_firestore" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.media_worker_sa.email}"
}

resource "google_project_iam_member" "media_worker_storage" {
  project = var.project_id
  role    = "roles/storage.objectAdmin"
  member  = "serviceAccount:${google_service_account.media_worker_sa.email}"
}

# 3. Eventarc Trigger Service Account
resource "google_service_account" "eventarc_sa" {
  account_id   = "backtrack-eventarc-sa"
  display_name = "BackTrack Eventarc Trigger Invoker Service Account"
  project      = var.project_id
}

resource "google_project_iam_member" "eventarc_receiver" {
  project = var.project_id
  role    = "roles/eventarc.eventReceiver"
  member  = "serviceAccount:${google_service_account.eventarc_sa.email}"
}

# Grant Eventarc SA permission to invoke the Media Worker Cloud Run service
resource "google_cloud_run_service_iam_member" "eventarc_invoker_worker" {
  location = var.region
  project  = var.project_id
  service  = google_cloud_run_service.media_worker.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.eventarc_sa.email}"
}
