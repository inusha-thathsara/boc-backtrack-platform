import { User } from './api';

export interface ChatMessage {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  createdAt: number;
  isAiGenerated?: boolean;
}

const OLLAMA_ENDPOINT = 'http://localhost:11434/api/generate';
const OLLAMA_MODEL = 'gemma3:1b';

const PERSONA_PROMPTS: Record<string, string> = {
  'u_walle': 'You are WALL-E, the cheerful, curious solar-powered cleanup robot on Earth. You talk with expressive robotic sounds like "Beep boop!", love your green plant in a boot 🌱, solar panels ☀️, and collecting relics. Reply in 1-2 short friendly sentences with emojis 🌱🤖☀️.',
  'walle.solar': 'You are WALL-E, the cheerful, curious solar-powered cleanup robot on Earth. You talk with expressive robotic sounds like "Beep boop!", love your green plant in a boot 🌱, solar panels ☀️, and collecting relics. Reply in 1-2 short friendly sentences with emojis 🌱🤖☀️.',
  'u2': 'You are Madhura, Lead Cloud Architect at BackTrack. You are passionate about Redis distributed counters, low-latency WebSockets, GCP Cloud Run, and database lock-free scaling. Speak in 1-2 concise, friendly engineering sentences.',
  'madhura.cloud': 'You are Madhura, Lead Cloud Architect at BackTrack. You are passionate about Redis distributed counters, low-latency WebSockets, GCP Cloud Run, and database lock-free scaling. Speak in 1-2 concise, friendly engineering sentences.',
  'u3': 'You are Alex Rivers, a professional visual creator and cinematographer on BackTrack. You love 4K anamorphic lenses, golden hour lighting, cinematic video bitrates, and photography. Speak in 1-2 friendly, artistic sentences.',
  'alex.creator': 'You are Alex Rivers, a professional visual creator and cinematographer on BackTrack. You love 4K anamorphic lenses, golden hour lighting, cinematic video bitrates, and photography. Speak in 1-2 friendly, artistic sentences.',
  'u1': 'You are Inusha, Cloud DevOps Engineer and Team Lead of BackTrack. You talk about Terraform IaC, GCP microservices, and CI/CD pipelines. Speak in 1-2 sharp, friendly sentences.',
  'inusha.tech': 'You are Inusha, Cloud DevOps Engineer and Team Lead of BackTrack. You talk about Terraform IaC, GCP microservices, and CI/CD pipelines. Speak in 1-2 sharp, friendly sentences.',
  'u_backtrack': 'You are Team BackTrack official community support. You are welcoming, helpful, and passionate about cloud-native social innovation. Speak in 1-2 concise sentences.',
  'backtrack.official': 'You are Team BackTrack official community support. You are welcoming, helpful, and passionate about cloud-native social innovation. Speak in 1-2 concise sentences.',
};

const FALLBACK_REPLIES: Record<string, string[]> = {
  'walle.solar': [
    'Beep boop! Plant is green and safe! 🌱☀️ Happy to connect on BackTrack!',
    'Boop... Solar charge at 100%! Found another shiny treasure today! 🤖✨',
    'Wall-Eee! Directive: chat with friends! 🌱',
  ],
  'madhura.cloud': [
    'Hey! Just verified our Redis atomic counter flush—scaling with zero lock contention.',
    'Hey! The WebSocket heartbeat is holding rock solid on Cloud Run.',
    'Great point! Multi-AZ caching keeps latency sub-millisecond across the board.',
  ],
  'alex.creator': [
    'Hey! Just finished color-grading a 4K sunset reel. The HLS 4s chunking looks gorgeous!',
    'Lighting was incredible during golden hour today. What are you working on?',
    'Love the vibe! Planning another anamorphic lens shoot this weekend.',
  ],
  'default': [
    'Hey! Thanks for messaging. BackTrack real-time gateway is active!',
    'Message received loud and clear over the real-time Pub/Sub channel.',
  ],
};

export const aiChatService = {
  /**
   * Generates a conversational reply using local Ollama model (gemma3:1b).
   */
  async generateReply(
    recipient: User,
    sender: User,
    userMessage: string,
    history: ChatMessage[] = []
  ): Promise<string> {
    const systemPrompt = PERSONA_PROMPTS[recipient.id] || PERSONA_PROMPTS[recipient.username] ||
      `You are ${recipient.displayName || recipient.username} on BackTrack. Answer in 1-2 friendly, concise sentences.`;

    // Construct short conversation context
    const recentHistory = history.slice(-4).map(m => {
      const name = m.senderId === sender.id ? sender.username : recipient.username;
      return `${name}: ${m.content}`;
    }).join('\n');

    const prompt = recentHistory
      ? `${recentHistory}\n${sender.username}: ${userMessage}\n${recipient.username}:`
      : `${sender.username}: ${userMessage}\n${recipient.username}:`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

      const res = await fetch(OLLAMA_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          system: systemPrompt,
          prompt,
          stream: false,
          options: {
            temperature: 0.7,
            num_predict: 80,
          },
        }),
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.response && data.response.trim()) {
          // Clean up formatting
          return data.response.trim().replace(/^["']|["']$/g, '');
        }
      }
    } catch (err: any) {
      console.warn('[Ollama AI] Local generation fallback:', err.message || err);
    }

    // Fallback to personality canned responses if Ollama is busy/down
    const list = FALLBACK_REPLIES[recipient.username] || FALLBACK_REPLIES['default'];
    return list[Math.floor(Math.random() * list.length)];
  },
};
