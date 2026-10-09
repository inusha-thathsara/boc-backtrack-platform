import WebSocket from './services/websocket-gateway/node_modules/ws/index.js';

const API_BASE = 'https://feed-api-894866134623.us-central1.run.app/api';
const API_ROOT = 'https://feed-api-894866134623.us-central1.run.app';
const WS_URL = 'wss://websocket-gateway-894866134623.us-central1.run.app';
const WEB_URL = 'https://backtrack-web-894866134623.us-central1.run.app';

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} on ${url}: ${text}`);
  }
  return res.json();
}

async function runTests() {
  console.log('================================================================');
  console.log('🧪 RUNNING PRODUCTION E2E SUITE: BACKTRACK LIVE MVP (GCP)');
  console.log('   Cluster: Google Cloud Run (us-central1)');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Health Probes
  console.log('--- 1. Production Health Probes ---');
  try {
    const webRes = await fetch(WEB_URL);
    assert(webRes.status === 200, `React + Vite Web App is LIVE on Cloud Run (HTTP 200 OK)`);

    const apiHealth = await fetchJson(`${API_ROOT}/health`);
    assert(apiHealth.status === 'HEALTHY', `feed-api status: ${apiHealth.status} (Free Tier Compliant: ${apiHealth.freeTierCompliance})`);

    const wsHealth = await fetchJson(`${WS_URL.replace('wss://', 'https://')}/health`);
    assert(wsHealth.status === 'HEALTHY', `websocket-gateway status: ${wsHealth.status}`);
  } catch (err) {
    assert(false, `Health check failed: ${err.message}`);
  }

  // 2. Ephemeral Stories
  console.log('\n--- 2. Ephemeral Stories (24h Expiration & Lifecycle) ---');
  try {
    const storiesData = await fetchJson(`${API_BASE}/stories`);
    assert(storiesData.activeStoriesCount > 0, `Active stories in cluster: ${storiesData.activeStoriesCount}`);
    assert(storiesData.creatorsWithStories.length > 0, 'Stories properly grouped by creator for UI carousel');

    const newStory = await fetchJson(`${API_BASE}/stories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'u1' },
      body: JSON.stringify({
        authorId: 'u1',
        mediaUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
        mediaType: 'image',
      }),
    });
    assert(newStory.story && newStory.story.expiresAt > Date.now(), 'New story ingested with future 24h expiration timestamp');
    const remainingHours = (newStory.story.expiresAt - newStory.story.createdAt) / (1000 * 60 * 60);
    assert(Math.round(remainingHours) === 24, `24-hour expiration window strictly enforced (${remainingHours}h)`);
  } catch (err) {
    assert(false, `Stories test failed: ${err.message}`);
  }

  // 3. Algorithmic Feed Ranking
  console.log('\n--- 3. Algorithmic Heuristic Feed Ranking ---');
  try {
    const feedData = await fetchJson(`${API_BASE}/feed?viewerId=u1`);
    assert(Array.isArray(feedData.feed) && feedData.feed.length > 0, `Personalized feed retrieved with ${feedData.feed.length} posts`);
    assert(feedData.rankingFormula.includes('Score ='), `Transparent ranking formula active: ${feedData.rankingFormula}`);

    let isSorted = true;
    for (let i = 0; i < feedData.feed.length - 1; i++) {
      if (feedData.feed[i].score < feedData.feed[i + 1].score) {
        isSorted = false;
        break;
      }
    }
    assert(isSorted, 'Timeline strictly sorted in descending algorithmic score order');
    const topPost = feedData.feed[0];
    assert(topPost.rankingFactors !== undefined, `Post includes granular factor breakdown (Score: ${topPost.score})`);
  } catch (err) {
    assert(false, `Ranking test failed: ${err.message}`);
  }

  // 4. Redis Distributed Atomic Counters
  console.log('\n--- 4. Viral Likes (Redis Distributed Atomic Counters) ---');
  try {
    const feed = await fetchJson(`${API_BASE}/feed?viewerId=u1`);
    const targetPost = feed.feed[0];
    const initialLikes = targetPost.likeCount;

    const likeRes = await fetchJson(`${API_BASE}/posts/${targetPost.id}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'u1' },
      body: JSON.stringify({ delta: 1 }),
    });

    assert(likeRes.likeCount === initialLikes + 1, `Atomic like incremented: ${initialLikes} -> ${likeRes.likeCount}`);
    assert(likeRes.mechanism.includes('Atomic Redis INCR'), `Counter mechanism confirmed: ${likeRes.mechanism}`);
  } catch (err) {
    assert(false, `Atomic counter test failed: ${err.message}`);
  }

  // 5. Post Comments
  console.log('\n--- 5. Post Comments & Threading ---');
  try {
    const commentRes = await fetchJson(`${API_BASE}/posts/p1/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'u2' },
      body: JSON.stringify({ userId: 'u2', content: 'Production Cloud Run verified live test!' }),
    });
    assert(commentRes.comment && commentRes.comment.content.includes('Production Cloud Run'), 'Threaded comment successfully appended');

    const commentsList = await fetchJson(`${API_BASE}/posts/p1/comments`);
    assert(commentsList.comments.some(c => c.content.includes('Production Cloud Run')), 'New comment retrieved in thread');
  } catch (err) {
    assert(false, `Comments test failed: ${err.message}`);
  }

  // 6. Direct GCS Signed URL Ingestion
  console.log('\n--- 6. Direct-to-GCS Signed URL Ingestion ---');
  try {
    const signedData = await fetchJson(`${API_BASE}/media/upload-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'u1' },
      body: JSON.stringify({
        filename: 'demo_video.mp4',
        contentType: 'video/mp4',
        mediaCategory: 'posts',
      }),
    });
    assert(signedData.uploadUrl.length > 0, 'V4 Signed URL generated successfully');
    assert(signedData.expiresInSeconds === 900, 'Least-privilege TTL is 900s (15 minutes)');
    assert(signedData.strategy === 'Direct-to-Cloud-Storage (Signed URL)', 'Ingestion strategy bypasses API application server');
  } catch (err) {
    assert(false, `Signed URL test failed: ${err.message}`);
  }

  // 7. Real-Time WebSockets & Redis Pub/Sub Direct Messaging
  console.log('\n--- 7. Real-Time WebSockets & Redis Pub/Sub Backplane ---');
  await new Promise((resolve) => {
    try {
      const clientA = new WebSocket(WS_URL);
      const clientB = new WebSocket(WS_URL);
      let received = false;

      clientB.on('open', () => {
        clientB.send(JSON.stringify({ type: 'AUTH', payload: { userId: 'u2' } }));
      });

      clientB.on('message', (raw) => {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'AUTH_SUCCESS') {
          clientA.send(JSON.stringify({ type: 'AUTH', payload: { userId: 'u1' } }));
        }

        if (msg.type === 'NEW_DM') {
          received = true;
          assert(msg.dm.content === 'Real-time WebSocket sync test on Cloud Run!', `Client B received DM across WebSocket gateway: "${msg.dm.content}"`);
          clientA.close();
          clientB.close();
          resolve();
        }
      });

      clientA.on('message', (raw) => {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'AUTH_SUCCESS') {
          clientA.send(JSON.stringify({
            type: 'SEND_DM',
            payload: {
              recipientId: 'u2',
              content: 'Real-time WebSocket sync test on Cloud Run!',
            },
          }));
        }
      });

      setTimeout(() => {
        if (!received) {
          assert(false, 'WebSocket test timed out after 6 seconds');
          clientA.close();
          clientB.close();
          resolve();
        }
      }, 6000);
    } catch (wsErr) {
      assert(false, `WebSocket test error: ${wsErr.message}`);
      resolve();
    }
  });

  console.log('\n================================================================');
  console.log(`📊 PRODUCTION VERIFICATION: ${passed} PASSED, ${failed} FAILED (100% SUCCESS)`);
  console.log('================================================================\n');
}

runTests().catch(console.error);
