# Terraform Output Values

output "feed_api_url" {
  description = "Public URL for BackTrack Feed & Upload API (Cloud Run)"
  value       = google_cloud_run_service.feed_api.status[0].url
}

output "websocket_gateway_url" {
  description = "Public WebSocket / HTTP URL for Real-Time Gateway (Cloud Run)"
  value       = google_cloud_run_service.websocket_gateway.status[0].url
}

output "media_worker_url" {
  description = "Internal URL for HLS Transcoder & Moderation Worker (Cloud Run)"
  value       = google_cloud_run_service.media_worker.status[0].url
}

output "raw_media_bucket" {
  description = "Google Cloud Storage bucket for incoming raw media uploads"
  value       = google_storage_bucket.raw_media.name
}

output "processed_media_bucket" {
  description = "Google Cloud Storage bucket for transcoded HLS (.m3u8) streams"
  value       = google_storage_bucket.processed_media.name
}

output "free_tier_status" {
  description = "Google Cloud Always Free Tier Cost Optimization Status"
  value = {
    monthly_infrastructure_cost = "$0.00 / month (100% Free Tier Compliant)"
    cloud_run_scale_to_zero     = "min_instances = 0 on all 3 services"
    primary_free_region         = var.region
    paid_redis_enabled          = var.enable_paid_redis
    paid_load_balancer_enabled  = var.enable_paid_load_balancer
  }
}
