variable "project_id" {
  description = "The Google Cloud Platform Project ID"
  type        = string
  default     = "backtrack-platform-prod"
}

variable "region" {
  description = "The primary GCP region (us-central1 is guaranteed in Always Free Tier)"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Environment name (e.g. production, staging)"
  type        = string
  default     = "production"
}

variable "raw_bucket_name_prefix" {
  description = "Prefix for the raw media GCS bucket"
  type        = string
  default     = "boc-raw-media"
}

variable "processed_bucket_name_prefix" {
  description = "Prefix for the processed HLS / transcoded media GCS bucket"
  type        = string
  default     = "boc-processed-media"
}

# Free Tier Safety Switches ($0/month Guarantee)
variable "enable_paid_redis" {
  description = "Set to true only if provisioning dedicated GCP Memorystore Redis (~$35/mo). Leave false for 100% Free Tier (uses in-memory or free-tier Upstash Redis)."
  type        = bool
  default     = false
}

variable "enable_paid_load_balancer" {
  description = "Set to true only if provisioning GCP Cloud Load Balancer (~$18/mo). Leave false for 100% Free Tier (leverages Cloud Run native HTTPS domains and Firebase Hosting edge CDN)."
  type        = bool
  default     = false
}

variable "feed_api_image" {
  description = "Container image for Feed API service"
  type        = string
  default     = "gcr.io/backtrack-platform-prod/feed-api:latest"
}

variable "websocket_gateway_image" {
  description = "Container image for WebSocket Gateway service"
  type        = string
  default     = "gcr.io/backtrack-platform-prod/websocket-gateway:latest"
}

variable "media_worker_image" {
  description = "Container image for Media Worker service"
  type        = string
  default     = "gcr.io/backtrack-platform-prod/media-worker:latest"
}
