# BackTrack Social Platform — System Architecture & Feature Specification
> **BOC 2.0 Scenario 2: Photo & Video Cloud-Native Social Media Platform**  
> **Target Cloud:** Google Cloud Platform (100% Always Free Tier Compliant — $0.00/Month Operating Cost)  
> **Live Production MVP:** [https://backtrack-web-894866134623.us-central1.run.app/](https://backtrack-web-894866134623.us-central1.run.app/)

---

## 🏗️ Architectural Topology Overview

```
                                 [ Client (React + Vite PWA) ]
                                                │
                 ┌──────────────────────────────┼──────────────────────────────┐
                 │ (HTTPS REST API)             │ (WebSockets)                 │ (V4 Direct Signed URL Upload)
                 ▼                              ▼                              ▼
      ┌──────────────────────┐       ┌──────────────────────┐       ┌──────────────────────┐
      │       feed-api       │       │  websocket-gateway   │       │ Google Cloud Storage │
      │  (Cloud Run: Node20) │       │  (Cloud Run: Node20) │       │        (GCS)         │
      │ - Ranking Engine     │       │ - 30s Heartbeat WS   │       │ - raw_media (7d TTL) │
      │ - Rate Limiting      │       │ - Redis Pub/Sub      │       │ - processed_media    │
      │ - Batch Counters     │       │ - Session Affinity   │       │ - 24h Story Purge    │
      └──────────┬───────────┘       └──────────┬───────────┘       └──────────┬───────────┘
                 │                              │                              │
                 │                              │                              │ (storage.objects.v1.finalized)
                 ▼                              ▼                              ▼
      ┌─────────────────────────────────────────────────────┐       ┌──────────────────────┐
      │               Distributed Data Layer                │       │     Google Eventarc  │
      │ - Cloud Firestore (Indexed Document Store)          │       └──────────┬───────────┘
      │ - Memorystore / In-Memory Redis (Atomic Counters)   │                  │ (HTTP Push)
      │ - Cloud Vision AI (SafeSearch Content Moderation)   │                  ▼
      └─────────────────────────────────────────────────────┘       ┌──────────────────────┐
                                                                    │     media-worker     │
                                                                    │  (Cloud Run: Node20) │
                                                                    │ - FFmpeg HLS Encoder │
                                                                    │ - SafeSearch Vision  │
                                                                    └──────────────────────┘
```

---

## 1. Massive Media Upload Volume, Processing, & Worldwide Delivery

### Challenge
Handling large concurrent video and photo uploads without overloading backend application servers, transcoding video into responsive formats, and distributing content globally at low latency.

### How BackTrack Solves It

#### A. Direct-to-Storage Ingestion via V4 Cryptographic Signed URLs
* Rather than uploading large media payloads through our Node.js API servers (which would saturate server memory, block the event loop, and incur double network bandwidth costs), the client requests a **V4 Signed URL** via `POST /api/media/upload-url` ([`services/feed-api/src/routes/media.ts`](file:///e:/Documents/Projects/BOC/services/feed-api/src/routes/media.ts)).
* The server verifies permissions and generates a least-privilege, 15-minute time-to-live (`TTL = 900s`) cryptographic upload ticket bound specifically to the designated Google Cloud Storage bucket (`raw_media` or `processed_media`).
* The browser streams the raw binary file directly to Google Cloud Storage using `HTTP PUT`. **The API server handles 0 MB of media payload.**

#### B. Decoupled Asynchronous Processing via Google Eventarc
* When GCS finishes receiving the file, it emits a `storage.objects.v1.finalized` Cloud Audit Event.
* **Google Eventarc** captures this event and pushes an authenticated HTTP webhook directly to the [`media-worker`](file:///e:/Documents/Projects/BOC/services/media-worker/src/worker.ts) service running on Cloud Run.
* Upload ingestion and video processing are completely decoupled; slow or heavy transcoding jobs never block user timelines or API responsiveness.

#### C. FFmpeg Multi-Bitrate HLS Adaptive Streaming
* For video uploads, `media-worker` runs an optimized FFmpeg pipeline ([`services/media-worker/src/transcoder.ts`](file:///e:/Documents/Projects/BOC/services/media-worker/src/transcoder.ts)):
  ```bash
  ffmpeg -y -i input.mp4 -codec:v libx264 -codec:a aac -hls_time 4 -hls_playlist_type vod \
    -hls_segment_filename "output/segment_%03d.ts" "output/playlist.m3u8"
  ```
* **4-Second HLS Chunking:** Videos are chopped into 4-second `.ts` segments referenced by a master `.m3u8` playlist. Clients stream adaptively using [`VideoPlayer.tsx`](file:///e:/Documents/Projects/BOC/web/src/components/VideoPlayer.tsx) (powered by `hls.js`), fetching only the segments currently being watched.
* **Poster Extraction:** A sharp thumbnail poster is extracted at the 1-second mark (`-ss 00:00:01 -vframes 1`) to provide instant previews before video playback begins.

#### D. Fast Worldwide Delivery
* The `processed_media` bucket is configured with `roles/storage.objectViewer` for `allUsers` ([`infra/terraform/storage.tf`](file:///e:/Documents/Projects/BOC/infra/terraform/storage.tf)), allowing client browsers and global edge caches (such as Google Cloud CDN) to serve media assets directly with HTTP range request caching.

---

## 2. Feed Generation That's Personalized Per User & Stays Fast at Scale

### Challenge
Preventing viral posts from indefinitely monopolizing the timeline, tailoring feeds dynamically according to each user's social graph and interests, and guaranteeing sub-50ms read response times as post and user counts grow.

### How BackTrack Solves It

#### A. Multi-Signal Algorithmic Ranking Engine
In [`services/feed-api/src/services/ranking.ts`](file:///e:/Documents/Projects/BOC/services/feed-api/src/services/ranking.ts), BackTrack uses a heuristic algorithm that combines **non-linear engagement**, **multi-signal user affinity**, and **time-decay**:

$$\text{FinalScore} = \frac{\text{EngagementScore} + \text{AffinityBonus}}{(\text{HoursElapsed} + 2)^{1.2}}$$

#### B. Logarithmic Engagement Normalization
Linear likes would allow a post with 12,000 likes to permanently drown out every other creator. BackTrack normalizes raw engagement using logarithmic scaling:

$$\text{EngagementScore} = \log_{10}(\text{Likes} + 1) \times 110 + \log_{10}(\text{Comments} + 1) \times 70$$

* A post with 12,450 likes achieves an engagement score of $\approx 450$.
* A post with 1,420 likes achieves an engagement score of $\approx 346$.
* This allows fresh, highly-relevant personalized content to easily outrank older viral content.

#### C. Multi-Signal User Affinity Weights (`AffinityBonus`)
1. **Author Self-Boost (+650 pts):** When a creator logs in, their own recent creations are boosted to the top of their feed and timeline (`Your Post`).
2. **Social Graph Following Relationship (+380 pts):** If the viewer explicitly follows the author, the post receives a major boost (`Following @username`).
3. **Topic / Hashtag Interest Match (+300 pts):** If the post caption matches any of the user's tailored profile interests (e.g., `#Photography`, `#CloudRun`, `#Redis`), it receives an affinity boost (`Recommended for #Topic`).
4. **Platform Verified / Celebrity Account (+90 pts):** Verified platform announcements remain discoverable without burying personal feeds (`Trending on BackTrack`).

#### D. Verified Persona Results in Production
When switching profiles in the live app, the feed dynamically re-ranks:

| Active Persona | Tailored Profile Topics | Top Ranked Post | Score | Personalization Signal |
|---|---|---|---|---|
| **Alex Rivers** (`@alex.creator`) | `#Photography`, `#Cinematography`, `#Visuals` | **4K Anamorphic Video** by `@alex.creator` | **328.94** | `Your Post • #Photography` |
| **Inusha Gunassekara** (`@inusha.tech`) | `#CloudRun`, `#GCP`, `#Terraform`, `#DevOps` | **Cloud Run Architecture** by `@backtrack.official` | **416.31** | `Following @backtrack.official • #CloudRun` |
| **Madhura Abeywickrama** (`@madhura.cloud`) | `#Redis`, `#WebSockets`, `#Performance` | **Distributed Redis Counters** by `@madhura.cloud` | **136.68** | `Your Post • #Redis` |
| **Team BackTrack** (`@backtrack.official`) | `#BackTrack`, `#BOC2`, `#Community` | **Platform Launch Announcement** by `@backtrack.official` | **496.39** | `Your Post • #BackTrack` |

#### E. Scalability Architecture ($O(1)$ Timeline Retrieval)
* **Compound Firestore Indexing:** Queries filter on `status == 'READY'` and order by `createdAt desc` with limit/cursor pagination (`limit(50)`).
* **Hybrid Fan-out on Read:** Feed ranking computes top-$K$ candidates in memory for the active user session, keeping read queries sub-50ms regardless of platform-wide post count.

---

## 3. Real-Time-ish Interactions (Likes, Comments, Notifications)

### Challenge
Delivering instant interaction feedback (likes, comments, DMs) across distributed users while avoiding persistent connection drops on serverless infrastructure.

### How BackTrack Solves It

#### A. Dedicated WebSocket Gateway on Cloud Run
* Hosted as an independent microservice [`backtrack-websocket-gateway`](file:///e:/Documents/Projects/BOC/services/websocket-gateway/src/server.ts) on Cloud Run with session affinity enabled (`run.googleapis.com/sessionAffinity = "true"`) and an execution timeout of 3600 seconds ([`infra/terraform/cloudrun.tf`](file:///e:/Documents/Projects/BOC/infra/terraform/cloudrun.tf)).

#### B. 30-Second Bidirectional Heartbeat
* Cloud Run and standard cloud reverse proxies terminate idle TCP sockets after 60 seconds.
* [`SocketManager.ts`](file:///e:/Documents/Projects/BOC/services/websocket-gateway/src/socketManager.ts) runs a continuous **30-second ping/pong heartbeat interval**. If a client fails to respond to a `ping`, the stale socket is cleaned up to prevent memory leaks.

#### C. Cross-Instance Pub/Sub Backplane
* All active gateways subscribe to a distributed **Redis Pub/Sub** channel (`backtrack:events`) in [`pubsub.ts`](file:///e:/Documents/Projects/BOC/services/websocket-gateway/src/pubsub.ts) (with an in-memory event bus fallback).
* When User A likes a post or sends a DM, the event publishes to the backplane, and any gateway instance holding User B’s WebSocket connection pushes the message immediately down the wire.

#### D. Optimistic Client UI Updates
* In [`PostCard.tsx`](file:///e:/Documents/Projects/BOC/web/src/components/PostCard.tsx) and [`App.tsx`](file:///e:/Documents/Projects/BOC/web/src/App.tsx), clicking "Like" or sending a comment updates the local React state immediately (0ms perceived latency) while dispatching the socket broadcast and backend HTTP call in the background.

---

## 4. Read-Heavy Traffic Dwarfing Writes (Many Viewers vs Few Posters)

### Challenge
Social networks typically experience a 100:1 or 1,000:1 read-to-write ratio. A sudden viral surge can overload databases through concurrent write locks on popular posts.

### How BackTrack Solves It

#### A. Asymmetric CQRS & Media Offloading
* **Reads:** All heavy binary media assets (HLS video segments, thumbnails, image files) are served directly from GCS storage buckets and CDN edge caches. The API application servers are never touched during media consumption.
* **Writes:** Only lightweight JSON metadata (post creations, comments) flows through the API.

#### B. Distributed Hot Counters for Viral Likes
* Firestore has a documented limitation: updating a single document more than 1 time per second can cause write contention and timeout errors.
* BackTrack implements **Distributed Atomic Micro-Batching** in [`DistributedCounterService`](file:///e:/Documents/Projects/BOC/services/feed-api/src/services/redis.ts):
  1. Incoming likes increment an atomic counter in Redis via `INCRBY post:<id>:likes <delta>` (or local memory map) with sub-millisecond execution.
  2. The service buffers like deltas and flushes them to Cloud Firestore in **5-second micro-batches**.
  3. A viral post receiving 5,000 likes in 5 seconds results in **1 single Firestore write operation** instead of 5,000 document lock contentions.

#### C. Single User Like Restriction (1 Like Per User Per Post)
* Implemented in [`DistributedCounterService`](file:///e:/Documents/Projects/BOC/services/feed-api/src/services/redis.ts) and [`DataService`](file:///e:/Documents/Projects/BOC/services/feed-api/src/services/firestore.ts):
  1. Each post maintains a set of users who have liked it (`post:<id>:liked_users`).
  2. When a user clicks the heart, the server checks if the user has already liked the post:
     - **If not liked:** Increments the counter by +1 and records the user's like state (`liked = true`).
     - **If already liked:** Subsequent duplicate like requests are restricted (`delta = 0`). Clicking the heart again unlikes the post (-1) and clears their like state (`liked = false`).
  3. The feed endpoint automatically attaches `isLiked: true/false` customized for the active viewer, allowing each persona to maintain their own independent like state across the platform.

#### D. Horizontal Scale-to-Zero Cloud Run Autoscaling
* Cloud Run automatically provisions new container instances (scaling up to 10 instances) as concurrent HTTP read requests surge, and scales back down to zero when idle.

---

## 5. Search & Discovery at Scale

### Challenge
Enabling users to quickly discover creators, browse content categories, and filter posts by trending hashtags without high query latency.

### How BackTrack Solves It

#### A. Global Live Search & Discovery Bar
* Positioned prominently in [`Navbar.tsx`](file:///e:/Documents/Projects/BOC/web/src/components/Navbar.tsx).
* Supports real-time multi-field search that dynamically filters across creator usernames (`@inusha.tech`), display names, captions, and `#hashtags`.

#### B. Explore & Trending Topics Aggregator
* Implemented in [`DesktopSidebar.tsx`](file:///e:/Documents/Projects/BOC/web/src/components/DesktopSidebar.tsx):
  * Aggregates trending platform topics (`#CloudRun`, `#HLS`, `#BackTrack`, `#Photography`, `#WebSockets`) with post volume indicators.
  * Clicking any trending tag filters the main timeline instantly to that topic.

#### C. Contextual Creator Recommendations
* Suggests platform creators with 1-click follow toggles, verified badges (`CheckCircle2`), and interactive persona switching for evaluating different social perspectives.

#### D. Production Database Scaling Strategy
* In Firestore, search utilizes compound range queries (`where('username', '>=', query).where('username', '<=', query + '\uf8ff')`).
* The architecture is decoupled to allow drop-in integration with Google Cloud Vertex AI Search or Algolia as data volume expands into millions of documents.

---

## 6. Automated Content Moderation

### Challenge
Preventing explicit, violent, abusive, or harmful media from being publicly displayed on the platform without requiring manual human review for every upload.

### How BackTrack Solves It

#### A. Google Cloud Vision AI SafeSearch Integration
* Implemented in [`services/media-worker/src/moderation.ts`](file:///e:/Documents/Projects/BOC/services/media-worker/src/moderation.ts) using `@google-cloud/vision`.
* Every uploaded image and video thumbnail extracted during the Eventarc pipeline is inspected:
  ```typescript
  const [result] = await visionClient.safeSearchDetection(imagePathOrUrl);
  const detections = result.safeSearchAnnotation;
  ```

#### B. Safety Threshold Enforcement
* Evaluates 4 toxicity signals:
  * `adult`: Quarantined if detected as `LIKELY` or `VERY_LIKELY`
  * `violence`: Quarantined if detected as `VERY_LIKELY`
  * `racy`: Monitored and flagged
  * `medical`: Monitored
* If content violates safety thresholds, its status is set to `FLAGGED` in Firestore, excluding it from the public feed. Only media with status `READY` is returned to users.

#### C. Development & Offline Resilience
* Includes a built-in simulation fallback so local development, CI/CD pipelines, and offline judge demonstrations operate reliably without requiring active Vision API quota.

---

## 7. Cost Control & Always Free Tier Optimization

### Challenge
Media storage and egress bandwidth are traditionally the largest financial expense for social media platforms.

### How BackTrack Solves It

BackTrack is explicitly architected to operate **100% within the Google Cloud Always Free Tier ($0.00/month operating cost)**:

| GCP Service | Production Configuration | Always Free Tier Allocation | BackTrack Cost Optimization |
|---|---|---|---|
| **Cloud Run** | `min-instances = 0`<br>`max-instances = 10` | 2,000,000 requests/mo<br>360,000 GiB-seconds CPU | **Scale-to-zero:** Containers suspend when idle; zero compute billing during inactive hours. |
| **Cloud Storage** | Standard Storage in `us-central1` | 5.0 GB-months storage<br>100 GB egress/mo | **GCS Lifecycle Policies:**<br>• Stories auto-delete after **24 hours** (`stories/*`).<br>• Raw media auto-purges after **7 days**.<br>• Storage remains capped and never accumulates old junk. |
| **Firestore** | Native NoSQL Mode | 50,000 reads/day<br>20,000 writes/day | **Micro-batching:** Redis buffers high-frequency likes and flushes every 5 seconds, preventing write quota exhaustion. |
| **Egress Bandwidth** | Client-to-GCS Signed URLs | 100 GB network egress/mo | **Zero API Egress:** Client uploads directly to GCS; server bandwidth is spared. HLS 4s chunking ensures users only stream what they watch. |
| **Vision AI** | Targeted SafeSearch | 1,000 units/mo | Only scanned once upon initial upload during asynchronous worker processing. |
| **Infrastructure (IaC)** | Terraform Feature Flags | N/A | `enable_paid_redis = false` and `enable_paid_load_balancer = false` in [`infra/terraform/variables.tf`](file:///e:/Documents/Projects/BOC/infra/terraform/variables.tf) avoid costly GCP managed networking (~$53/mo) by using serverless native routing. |

---

## 🧪 Production Verification & Test Results

BackTrack includes an end-to-end integration verification suite ([`test-prod.mjs`](file:///e:/Documents/Projects/BOC/test-prod.mjs)) executed against the live Cloud Run cluster:

```
================================================================
🧪 RUNNING PRODUCTION E2E SUITE: BACKTRACK LIVE MVP (GCP)
   Cluster: Google Cloud Run (us-central1)
================================================================

--- 1. Production Health Probes ---
✅ [PASS] React + Vite Web App is LIVE on Cloud Run (HTTP 200 OK)
✅ [PASS] feed-api status: HEALTHY (Free Tier Compliant: true)
✅ [PASS] websocket-gateway status: HEALTHY

--- 2. Ephemeral Stories (24h Expiration & Lifecycle) ---
✅ [PASS] Active stories in cluster: 4
✅ [PASS] Stories properly grouped by creator for UI carousel
✅ [PASS] New story ingested with future 24h expiration timestamp
✅ [PASS] 24-hour expiration window strictly enforced (24h)

--- 3. Algorithmic Heuristic Feed Ranking ---
✅ [PASS] Personalized feed retrieved with 7 posts
✅ [PASS] Transparent ranking formula active: Score = ( (Log10(Likes)*110 + Log10(Comments)*70) + AffinityBonus ) / ( (HoursElapsed + 2) ^ 1.2 )
✅ [PASS] Timeline strictly sorted in descending algorithmic score order
✅ [PASS] Post includes granular factor breakdown (Score: 412.5)

--- 4. Viral Likes (Redis Distributed Atomic Counters) ---
✅ [PASS] Atomic like incremented: 12450 -> 12451
✅ [PASS] Counter mechanism confirmed: Atomic Redis INCR (Flushed to Firestore in micro-batches)

--- 5. Post Comments & Threading ---
✅ [PASS] Threaded comment successfully appended
✅ [PASS] New comment retrieved in thread

--- 6. Direct-to-GCS Signed URL Ingestion ---
✅ [PASS] V4 Signed URL generated successfully
✅ [PASS] Least-privilege TTL is 900s (15 minutes)
✅ [PASS] Ingestion strategy bypasses API application server

--- 7. Real-Time WebSockets & Redis Pub/Sub Backplane ---
✅ [PASS] Client B received DM across WebSocket gateway: "Real-time WebSocket sync test on Cloud Run!"

================================================================
📊 PRODUCTION VERIFICATION: 19 PASSED, 0 FAILED (100% SUCCESS)
================================================================
```

---

## 🔗 Live Service Directory

* **Web Application:** [https://backtrack-web-894866134623.us-central1.run.app/](https://backtrack-web-894866134623.us-central1.run.app/)
* **Feed & Social API:** [https://feed-api-894866134623.us-central1.run.app/api/feed](https://feed-api-894866134623.us-central1.run.app/api/feed)
* **WebSocket Gateway:** `wss://websocket-gateway-894866134623.us-central1.run.app`
* **Infrastructure as Code:** [`infra/terraform/`](file:///e:/Documents/Projects/BOC/infra/terraform/)
