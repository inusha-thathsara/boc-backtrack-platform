# Google Cloud Platform Provisioning Script for BackTrack MVP
param(
    [string]$ProjectId = (gcloud config get-value project 2>$null),
    [string]$Region = "us-central1"
)

if (-not $ProjectId) {
    Write-Error "No GCP Project ID specified or configured in gcloud. Run 'gcloud config set project <ID>' or pass -ProjectId"
    exit 1
}

Write-Host ">>> Configuring GCP Project: $ProjectId in Region: $Region" -ForegroundColor Cyan

# 1. Enable Required Services
Write-Host ">>> Enabling GCP APIs..." -ForegroundColor Yellow
gcloud services enable `
    run.googleapis.com `
    eventarc.googleapis.com `
    firestore.googleapis.com `
    storage.googleapis.com `
    vision.googleapis.com `
    redis.googleapis.com `
    cloudbuild.googleapis.com `
    artifactregistry.googleapis.com `
    --project $ProjectId

# 2. Bucket Definitions
$RawBucket = "boc-raw-media-$ProjectId"
$ProcessedBucket = "boc-processed-media-$ProjectId"

Write-Host ">>> Creating Cloud Storage Buckets..." -ForegroundColor Yellow
gcloud storage buckets create "gs://$RawBucket" --project=$ProjectId --location=$Region --uniform-bucket-level-access 2>$null
gcloud storage buckets create "gs://$ProcessedBucket" --project=$ProjectId --location=$Region --uniform-bucket-level-access 2>$null

# 3. Apply CORS and Lifecycle policies
Write-Host ">>> Applying CORS & Lifecycle Policies..." -ForegroundColor Yellow
gcloud storage buckets update "gs://$RawBucket" --cors-file="infra/cors.json"
gcloud storage buckets update "gs://$ProcessedBucket" --cors-file="infra/cors.json"
gcloud storage buckets update "gs://$ProcessedBucket" --lifecycle-file="infra/lifecycle-stories.json"

# Make processed bucket publicly readable for direct CDN/browser playback in MVP
gcloud storage buckets add-iam-policy-binding "gs://$ProcessedBucket" `
    --member="allUsers" `
    --role="roles/storage.objectViewer"

# 4. Service Account for Worker Jobs
$WorkerSA = "media-worker-sa@$ProjectId.iam.gserviceaccount.com"
Write-Host ">>> Setting up Service Account for Media Worker: $WorkerSA" -ForegroundColor Yellow
gcloud iam service-accounts create media-worker-sa --display-name="Media Worker Service Account" --project=$ProjectId 2>$null

# Grant permissions to SA
gcloud projects add-iam-policy-binding $ProjectId --member="serviceAccount:$WorkerSA" --role="roles/datastore.user"
gcloud storage buckets add-iam-policy-binding "gs://$RawBucket" --member="serviceAccount:$WorkerSA" --role="roles/storage.objectViewer"
gcloud storage buckets add-iam-policy-binding "gs://$ProcessedBucket" --member="serviceAccount:$WorkerSA" --role="roles/storage.objectAdmin"

Write-Host ">>> Infrastructure Provisioning Complete!" -ForegroundColor Green
Write-Host "Raw Bucket: gs://$RawBucket"
Write-Host "Processed Bucket: gs://$ProcessedBucket"
