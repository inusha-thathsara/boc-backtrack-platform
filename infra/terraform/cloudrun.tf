# Cloud Run Microservices (Always Free Tier scale-to-zero architecture)

# 1. Feed API Service
resource "google_cloud_run_service" "feed_api" {
  name     = "backtrack-feed-api"
  location = var.region
  project  = var.project_id

  template {
    spec {
      service_account_name = google_service_account.feed_api_sa.email
      containers {
        image = var.feed_api_image

        resources {
          limits = {
            cpu    = "1000m"
            memory = "512Mi"
          }
        }

        env {
          name  = "NODE_ENV"
          value = "production"
        }
        env {
          name  = "GCP_PROJECT_ID"
          value = var.project_id
        }
        env {
          name  = "RAW_MEDIA_BUCKET"
          value = google_storage_bucket.raw_media.name
        }
        env {
          name  = "PROCESSED_MEDIA_BUCKET"
          value = google_storage_bucket.processed_media.name
        }
        env {
          name  = "CORS_ORIGIN"
          value = "*"
        }
      }
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale" = "0" # $0 idle cost scale-to-zero
        "autoscaling.knative.dev/maxScale" = "10"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [google_project_service.required_services]
}

resource "google_cloud_run_service_iam_member" "feed_api_public" {
  location = var.region
  project  = var.project_id
  service  = google_cloud_run_service.feed_api.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# 2. WebSocket Gateway Service
resource "google_cloud_run_service" "websocket_gateway" {
  name     = "backtrack-websocket-gateway"
  location = var.region
  project  = var.project_id

  template {
    spec {
      containers {
        image = var.websocket_gateway_image

        resources {
          limits = {
            cpu    = "1000m"
            memory = "512Mi"
          }
        }

        env {
          name  = "NODE_ENV"
          value = "production"
        }
        env {
          name  = "PORT"
          value = "8081"
        }
      }
      # WebSocket support with max connection timeout
      timeout_seconds = 3600
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale"        = "0"
        "autoscaling.knative.dev/maxScale"        = "5"
        "run.googleapis.com/sessionAffinity"      = "true"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [google_project_service.required_services]
}

resource "google_cloud_run_service_iam_member" "websocket_public" {
  location = var.region
  project  = var.project_id
  service  = google_cloud_run_service.websocket_gateway.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# 3. Media Worker Service (Eventarc triggered async processor)
resource "google_cloud_run_service" "media_worker" {
  name     = "backtrack-media-worker"
  location = var.region
  project  = var.project_id

  template {
    spec {
      service_account_name = google_service_account.media_worker_sa.email
      containers {
        image = var.media_worker_image

        resources {
          limits = {
            cpu    = "1000m"
            memory = "1024Mi"
          }
        }

        env {
          name  = "NODE_ENV"
          value = "production"
        }
        env {
          name  = "GCP_PROJECT_ID"
          value = var.project_id
        }
        env {
          name  = "RAW_MEDIA_BUCKET"
          value = google_storage_bucket.raw_media.name
        }
        env {
          name  = "PROCESSED_MEDIA_BUCKET"
          value = google_storage_bucket.processed_media.name
        }
      }
      # Up to 5 minutes execution timeout for video transcoding
      timeout_seconds = 300
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale" = "0"
        "autoscaling.knative.dev/maxScale" = "10"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [google_project_service.required_services]
}
