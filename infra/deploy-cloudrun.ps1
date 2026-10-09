# Cloud Run Automated Deployment Script
param(
    [string]$ProjectId = (gcloud config get-value project 2>$null),
    [string]$Region = "us-central1"
)

if (-not $ProjectId) {
    Write-Error "No GCP Project ID set. Run 'gcloud config set project <ID>'."
    exit 1
}

Write-Host ">>> Deploying BackTrack Social Platform Microservices to GCP Cloud Run..." -ForegroundColor Cyan

# 1. Deploy Feed API
Write-Host ">>> [1/3] Deploying feed-api to Cloud Run..." -ForegroundColor Yellow
gcloud run deploy feed-api `
    --source services/feed-api `
    --region $Region `
    --project $ProjectId `
    --platform managed `
    --allow-unauthenticated `
    --set-env-vars "GCP_PROJECT_ID=$ProjectId,RAW_MEDIA_BUCKET=boc-raw-media-$ProjectId,PROCESSED_MEDIA_BUCKET=boc-processed-media-$ProjectId,NODE_ENV=production,CORS_ORIGIN=*" `
    --min-instances 0 `
    --max-instances 10

# 2. Deploy WebSocket Gateway
Write-Host ">>> [2/3] Deploying websocket-gateway to Cloud Run..." -ForegroundColor Yellow
gcloud run deploy websocket-gateway `
    --source services/websocket-gateway `
    --region $Region `
    --project $ProjectId `
    --platform managed `
    --allow-unauthenticated `
    --session-affinity `
    --set-env-vars "GCP_PROJECT_ID=$ProjectId,NODE_ENV=production" `
    --min-instances 0 `
    --max-instances 10

# 3. Deploy Media Transcoding Worker
Write-Host ">>> [3/3] Deploying media-worker (FFmpeg) to Cloud Run..." -ForegroundColor Yellow
gcloud run deploy media-worker `
    --source services/media-worker `
    --region $Region `
    --project $ProjectId `
    --platform managed `
    --no-allow-unauthenticated `
    --service-account "media-worker-sa@$ProjectId.iam.gserviceaccount.com" `
    --set-env-vars "GCP_PROJECT_ID=$ProjectId,RAW_MEDIA_BUCKET=boc-raw-media-$ProjectId,PROCESSED_MEDIA_BUCKET=boc-processed-media-$ProjectId,NODE_ENV=production" `
    --memory 2Gi `
    --cpu 2 `
    --timeout 900 `
    --min-instances 0 `
    --max-instances 5

# 4. Deploy Frontend Web App (React + Vite)
Write-Host ">>> [4/4] Deploying backtrack-web to Cloud Run..." -ForegroundColor Yellow
gcloud run deploy backtrack-web `
    --source web `
    --region $Region `
    --project $ProjectId `
    --platform managed `
    --allow-unauthenticated `
    --min-instances 0 `
    --max-instances 10

Write-Host ">>> All Cloud Run microservices & frontend successfully deployed!" -ForegroundColor Green
gcloud run services list --project $ProjectId

