# BackTrack Cloud Social Platform — BOC 2.0 MVP

This repository contains the working cloud-native MVP implementation for **Team BackTrack's** submission in **Beauty of Cloud 2.0 (BOC 2.0) — Scenario 2: Photo & Video Social Platform**.

Built natively on **Google Cloud Platform (GCP)** with an event-driven, serverless-first microservices architecture.

---

## Architecture Components

1. **`services/feed-api` (Google Cloud Run)**
   - Manages user profiles, social graph, timeline generation, comments, and post metadata.
   - Generates ephemeral Google Cloud Storage V4 Signed URLs (15-min TTL) for direct client uploads.
   - Integrates **Algorithmic Heuristic Feed Ranking** with time decay and engagement weighting.
   - Uses **Redis Distributed Atomic Counters** (`INCR`) to handle viral post likes without Firestore write throttling.

2. **`services/media-worker` (Google Cloud Run + FFmpeg)**
   - Triggered asynchronously by **Eventarc** on `OBJECT_FINALIZE` in the raw media bucket.
   - Encodes videos into adaptive multi-bitrate HTTP Live Streaming (**HLS** `.m3u8` and `.ts` chunks).
   - Generates WebP image thumbnails.
   - Runs content moderation with **Google Cloud Vision API** SafeSearch.
   - Writes back to Firestore with a status callback updating the post to `READY`.

3. **`services/websocket-gateway` (Google Cloud Run + Redis Pub/Sub)**
   - Real-time WebSocket gateway backed by a shared **Memorystore (Redis) Pub/Sub backplane**.
   - Ensures live likes, comments, and Direct Messages (DMs) route across ephemeral container instances.

4. **`web/` (React + Vite + HLS.js)**
   - Mobile-first, sleek Instagram-style web application.
   - **Stories Tray**: 24-hour ephemeral stories with animated gradient rings and auto-advancing modal viewer.
   - **Video Feed**: Adaptive HLS video playback with dynamic bitrate indicators.
   - **Direct GCS Ingestion**: Client uploads directly to GCS via Signed URLs.
   - **Live DMs**: Instant bidirectional chat via WebSockets.
   - **Algorithm Inspector**: Real-time display of the exact heuristic ranking calculation per post.

5. **`infra/`**
   - Automation scripts (`setup-gcp.ps1`, `deploy-cloudrun.ps1`) for GCP bucket provisioning, CORS, 24h story lifecycle rules, IAM roles, and Cloud Run deployments.

---

## Quick Start (Local Run)

### 1. Install Dependencies
```bash
# Install root orchestrator and all sub-packages
npm run install:all
```

Or install individual packages:
```bash
cd services/feed-api && npm install && cd ../..
cd services/websocket-gateway && npm install && cd ../..
cd services/media-worker && npm install && cd ../..
cd web && npm install && cd ../..
```

### 2. Start Services Locally

In separate terminal windows:

```bash
# Terminal 1: Feed API (Port 8080)
npm run dev:api

# Terminal 2: WebSocket Gateway (Port 8081)
npm run dev:ws

# Terminal 3: Media Transcoding Worker (Port 8082)
npm run dev:worker

# Terminal 4: Web Client (Port 3000)
npm run dev:web
```

Open `http://localhost:3000` in your browser.

---

## Deploying to Google Cloud Platform (GCP)

### 1. Provision Infrastructure
Run the provisioning script using your active `gcloud` account:
```powershell
.\infra\setup-gcp.ps1 -ProjectId "your-gcp-project-id" -Region "us-central1"
```

### 2. Deploy Microservices to Cloud Run
```powershell
.\infra\deploy-cloudrun.ps1 -ProjectId "your-gcp-project-id" -Region "us-central1"
```

### 3. Deploy Frontend
Build the production bundle and deploy to Firebase Hosting or Cloud Storage:
```bash
cd web
npm run build
```
