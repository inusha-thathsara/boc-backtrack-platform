import http from 'http';
import WebSocket from './services/websocket-gateway/node_modules/ws/index.js';

const API_BASE = 'http://localhost:8080/api';
const WS_URL = 'ws://localhost:8081';
const WEB_URL = 'http://localhost:3000';

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} on ${url}: ${text}`);
  }
  return res.json();
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING COMPREHENSIVE E2E TESTS: BACKTRACK MVP');
  console.log('====================================================\n');

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

  // 1. Health Checks
  console.log('--- 1. Service Health Checks ---');
  try {
    const apiHealth = await fetchJson('http://localhost:8080/health');
    assert(apiHealth.status === 'HEALTHY', 'Feed API health check returned HEALTHY');

    const wsHealth = await fetchJson('http://localhost:8081/health');
    assert(wsHealth.status === 'HEALTHY', 'WebSocket Gateway health check returned HEALTHY');

    const webRes = await fetch(WEB_URL);
    assert(webRes.status === 200, 'React + Vite Web Client is serving on port 3000 (HTTP 200)');
  } catch (err) {
    assert(false, `Health check failed: ${err.message}`);
  }

  // 2. Stories Tray & 24h TTL Expiration
  console.log('\n--- 2. Ephemeral Stories (24h Expiration) ---');
  try {
    const storiesData = await fetchJson(`${API_BASE}/stories`);
    assert(storiesData.activeStoriesCount > 0, `Active stories found: ${storiesData.activeStoriesCount}`);
    assert(storiesData.creatorsWithStories.length > 0, 'Stories grouped by creator for the Stories Tray');

    // Test creating a new 24h story
    const newStory = await fetchJson(`${API_BASE}/stories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        authorId: 'u1',
        mediaUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
        mediaType: 'image',
      }),
    });
    assert(newStory.story && newStory.story.expiresAt > Date.now(), 'New story created with future 24h expiration timestamp');
    const remainingHours = (newStory.story.expiresAt - newStory.story.createdAt) / (1000 * 60 * 60);
    assert(Math.round(remainingHours) === 24, `Expiration window is exactly 24 hours (calculated: ${remainingHours}h)`);
  } catch (err) {
    assert(false, `Stories test failed: ${err.message}`);
  }

  // 3. Algorithmic Feed Ranking
  console.log('\n--- 3. Algorithmic Heuristic Feed Ranking ---');
  try {
    const feedData = await fetchJson(`${API_BASE}/feed?viewerId=u1`);
    assert(Array.isArray(feedData.feed) && feedData.feed.length > 0, `Feed retrieved with ${feedData.feed.length} posts`);
    assert(feedData.rankingFormula.includes('Score ='), `Transparent ranking formula returned: ${feedData.rankingFormula}`);

    // Verify posts are sorted in descending score order
    let isSorted = true;
    for (let i = 0; i < feedData.feed.length - 1; i++) {
      if (feedData.feed[i].score < feedData.feed[i + 1].score) {
        isSorted = false;
        break;
      }
    }
    assert(isSorted, 'Posts are strictly ranked in descending order of algorithmic score');
    const topPost = feedData.feed[0];
    assert(topPost.rankingFactors !== undefined, `Top post "${topPost.id}" includes detailed ranking factors (Score: ${topPost.score})`);
  } catch (err) {
    assert(false, `Ranking test failed: ${err.message}`);
  }

  // 4. Redis Distributed Atomic Counters
  console.log('\n--- 4. High-Throughput Likes (Redis Distributed Counters) ---');
  try {
    const feed = await fetchJson(`${API_BASE}/feed?viewerId=u1`);
    const targetPost = feed.feed[0];
    const initialLikes = targetPost.likeCount;

    const likeRes = await fetchJson(`${API_BASE}/posts/${targetPost.id}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delta: 1 }),
    });

    assert(likeRes.likeCount === initialLikes + 1, `Atomic like count incremented: ${initialLikes} -> ${likeRes.likeCount}`);
    assert(likeRes.mechanism.includes('Atomic Redis INCR'), 'Counter mechanism confirmed as Atomic Redis INCR');
  } catch (err) {
    assert(false, `Atomic counter test failed: ${err.message}`);
  }

  // 5. Comments
  console.log('\n--- 5. Post Comments ---');
  try {
    const newComment = await fetchJson(`${API_BASE}/posts/p1/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'u2', content: 'Automated test comment on GCP architecture!' }),
    });
    assert(newComment.comment && newComment.comment.content.includes('Automated test'), 'Comment successfully added to post');

    const commentsList = await fetchJson(`${API_BASE}/posts/p1/comments`);
    assert(commentsList.comments.some(c => c.content.includes('Automated test')), 'New comment retrieved in thread');
  } catch (err) {
    assert(false, `Comments test failed: ${err.message}`);
  }

  // 6. Direct-to-GCS Signed URL Ingestion
  console.log('\n--- 6. Direct GCS Signed URL Ingestion ---');
  try {
    const signedData = await fetchJson(`${API_BASE}/media/upload-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: 'demo_video.mp4',
        contentType: 'video/mp4',
        mediaCategory: 'posts',
      }),
    });
    assert(signedData.uploadUrl.length > 0, 'V4 Signed URL successfully generated');
    assert(signedData.expiresInSeconds === 900, 'Signed URL TTL is 900s (15 minutes least-privilege)');
    assert(signedData.strategy === 'Direct-to-Cloud-Storage (Signed URL)', 'Ingestion strategy bypasses API application server');
  } catch (err) {
    assert(false, `Signed URL test failed: ${err.message}`);
  }

  // 7. Real-Time WebSockets & Redis Pub/Sub Direct Messaging
  console.log('\n--- 7. Real-Time WebSockets & DMs ---');
  await new Promise((resolve) => {
    try {
      const clientA = new WebSocket(WS_URL);
      const clientB = new WebSocket(WS_URL);

      let clientBAuthenticated = false;

      clientB.on('open', () => {
        clientB.send(JSON.stringify({ type: 'AUTH', payload: { userId: 'u2' } }));
      });

      clientB.on('message', (raw) => {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'AUTH_SUCCESS') {
          clientBAuthenticated = true;

          // Now authenticate client A and send DM to client B
          clientA.send(JSON.stringify({ type: 'AUTH', payload: { userId: 'u1' } }));
        }

        if (msg.type === 'NEW_DM') {
          assert(msg.dm.content === 'Real-time WebSocket sync test!', `Client B received DM over Redis Pub/Sub socket: "${msg.dm.content}"`);
          clientA.close();
          clientB.close();
          resolve();
        }
      });

      clientA.on('open', () => {
        // Wait for Client B to be ready
      });

      clientA.on('message', (raw) => {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'AUTH_SUCCESS') {
          // Send DM to u2
          clientA.send(JSON.stringify({
            type: 'SEND_DM',
            payload: {
              recipientId: 'u2',
              content: 'Real-time WebSocket sync test!',
            },
          }));
        }
      });

      setTimeout(() => {
        if (!clientBAuthenticated) {
          assert(false, 'WebSocket test timed out after 5 seconds');
          clientA.close();
          clientB.close();
          resolve();
        }
      }, 5000);
    } catch (wsErr) {
      assert(false, `WebSocket test error: ${wsErr.message}`);
      resolve();
    }
  });

  console.log('\n====================================================');
  console.log(`📊 TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');
}

runTests().catch(console.error);
