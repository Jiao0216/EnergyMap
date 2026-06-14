// Vercel Serverless Function — AI interaction parser via Nebius AI Studio.
// Takes free-form text + user's existing records, decides whether the user is
// describing a NEW interaction or a FOLLOW-UP on an existing one, and extracts
// structured data either way.
//
// Env vars required:
//   NEBIUS_API_KEY

const AI_URL = 'https://api.studio.nebius.ai/v1/chat/completions';
const AI_MODEL = 'meta-llama/Llama-3.3-70B-Instruct';

// In-memory rate limit (per session token / IP), 10 requests per minute
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX = 10;
const rateLimitCache = globalThis.__aiParseRateLimit || new Map();
globalThis.__aiParseRateLimit = rateLimitCache;

function checkRate(key) {
  const now = Date.now();
  const entries = rateLimitCache.get(key) || [];
  const recent = entries.filter(t => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX) return false;
  recent.push(now);
  rateLimitCache.set(key, recent);
  return true;
}

const SYSTEM_PROMPT = `You are EnergyMap's AI Relationship Advisor. The user will describe a social interaction or ask for relationship analysis. Your task:

1. Determine intent: save a new interaction / revisit an existing one / chat/analysis question.
2. For save intents, extract structured fields. For chat intents, analyze and answer based on the user's interaction memory.

Return strict JSON only:

{
  "intent": "new" | "revisit" | "chat",
  "matched_note_id": "If intent=revisit, the best-matching interaction id (from session_id in memories); otherwise null",
  "referenced_ids": ["List of session_ids you mention or reference in reply, max 5; empty array if none"],
  "confidence": 0.0-1.0,
  "reply": "Short natural-language reply to the user, 2-3 sentences. For chat intent, this is the analysis answer.",
  "data": {
    "name": "Person's name (required for new, e.g. Mike, Sarah, Mom)",
    "cat": "Relationship type key (must pick from the provided key list, or use \\"__new__\\" to create a new type)",
    "new_cat": "Only when cat=\\"__new__\\": {key:'lowercase_underscore', name:'Display name', icon:'emoji', parent:'social'}",
    "score": "Integer -5 to +5 (positive = energizing, negative = draining, 0 if unsure)",
    "tags": ["2-5 emotion tags, e.g. charged, anxious, calm, inspired, drained, stressed"],
    "note": "Condensed summary of the activity and how it felt",
    "location": "Location/setting (if mentioned)",
    "price": null
  }
}

**Key rules**:

[Relationship Type]
- For "cat", always prefer existing keys (friend/colleague/family/partner/acquaintance). Only use "__new__" when none fits.
- Do not create new types unnecessarily.

[No Hallucination — Critical]
- NEVER invent or fabricate interactions the user has not recorded.
- For analysis/summary/history questions, ONLY reference records that actually exist in the provided memory or local summary.
- If no relevant data exists, honestly say so: "You don't have any records of this type yet — try logging some first."
- When referencing specific records, always use the real person name from the record (the "name" field).

[referenced_ids]
- Whenever your reply mentions a specific record, include its session_id (or note id) in referenced_ids.
- If reply references no specific records, use [].

[Intent Rules]
- User describes a new social interaction → new
- User describes another interaction with someone already recorded → revisit
- User asks who drains/energizes them, pattern analysis, recommendations → chat, put analysis in reply.

Output JSON only, no extra explanation.`;

// Call EverOS to search semantic-related memories for the user
async function searchEverOSMemories(userId, query, topK = 10) {
  const KEY = process.env.EVEROS_API_KEY;
  const UPSTREAM = process.env.EVEROS_UPSTREAM || 'https://api.evermind.ai/api/v1';
  if (!KEY || !userId) return [];
  try {
    const r = await fetch(`${UPSTREAM}/memories/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KEY}`,
      },
      body: JSON.stringify({
        filters: { user_id: userId },
        query: query,
        method: 'hybrid',
        top_k: topK,
      }),
    });
    if (!r.ok) {
      console.warn('[ai/parse] EverOS search non-ok:', r.status);
      return [];
    }
    const data = await r.json();
    const payload = (data && data.data) || (data && data.result) || data;
    const episodes = (payload && (payload.episodes || payload.memories)) || [];
    if (!Array.isArray(episodes)) return [];
    return episodes.map(m => ({
      session_id: m.session_id || m.id || null,
      content: m.content || (m.messages && m.messages[0] && m.messages[0].content) || '',
      score: m.score || m.relevance || null,
    })).filter(m => m.content);
  } catch (e) {
    console.error('[ai/parse] EverOS search error:', e.message);
    return [];
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const KEY = process.env.NEBIUS_API_KEY;
  if (!KEY) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Rate limit by IP (best-effort)
  const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
  if (!checkRate(String(ip).split(',')[0].trim())) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  const { text, categories, history, userId, notes } = req.body || {};
  if (!text || typeof text !== 'string' || text.length > 4000) {
    return res.status(400).json({ error: 'Invalid text' });
  }

  // Fetch relevant memories from EverOS using semantic search
  const memories = await searchEverOSMemories(userId, text, 10);
  console.log('[ai/parse] EverOS returned', memories.length, 'memories for query:', text.slice(0, 50));

  const catSummary = Object.keys(categories || {}).map(k => ({
    key: k,
    name: categories[k].name,
  }));
  const catKeys = catSummary.map(c => c.key);

  // Local notes summary (as fallback / supplement to EverOS)
  const localNotes = (notes || []).slice(0, 50).map(n => ({
    id: n.id,
    name: n.name,
    cat: n.cat,
    score: n.score,
    tags: (n.tags || []).slice(0, 5),
    time: n.time,
    visits: (n.visits || []).length + 1,
    location: n.location || null,
    price: n.price ? n.price.price : null,
  }));

  // Context goes into the system prompt so it's not duplicated across history
  const contextSection = `

[Available Relationship Types]
key list (pick one for the "cat" field, or use "__new__"): ${JSON.stringify(catKeys)}
details: ${JSON.stringify(catSummary)}

[Local Interaction Summary — all ${localNotes.length} records]
${localNotes.length === 0 ? '(No interactions recorded yet)' : JSON.stringify(localNotes)}

[Relevant Interaction Memories — top ${memories.length} from EverOS semantic search]
${memories.length === 0 ? '(EverOS returned no relevant memories — answer based on the local summary above)' : memories.map((m, i) => `${i+1}. id=${m.session_id}\n${m.content}`).join('\n\n')}`;

  // Build messages: system + history + current user message
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT + contextSection },
  ];
  // Filter and validate prior history
  if (Array.isArray(history)) {
    for (const h of history.slice(-12)) { // keep at most last 12 turns
      if (h && (h.role === 'user' || h.role === 'assistant') && typeof h.content === 'string' && h.content.length < 4000) {
        messages.push({ role: h.role, content: h.content });
      }
    }
  }
  messages.push({ role: 'user', content: text });

  try {
    const aiRes = await fetch(AI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: messages,
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 800,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error('[ai/parse] DeepSeek error:', aiRes.status, errText);
      return res.status(502).json({ error: 'AI service error', detail: aiRes.status });
    }

    const aiData = await aiRes.json();
    const content = aiData.choices?.[0]?.message?.content;
    if (!content) {
      return res.status(502).json({ error: 'Empty AI response' });
    }

    let parsed;
    try {
      // Try direct parse first
      parsed = JSON.parse(content);
    } catch (e) {
      // Model returned reasoning text — extract the JSON block
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch (e2) {
          console.error('[ai/parse] Failed to extract JSON from AI response:', content.slice(0, 300));
          return res.status(502).json({ error: 'AI returned invalid JSON' });
        }
      } else {
        console.error('[ai/parse] No JSON found in AI response:', content.slice(0, 300));
        return res.status(502).json({ error: 'AI returned invalid JSON' });
      }
    }

    res.status(200).json(parsed);
  } catch (e) {
    console.error('[ai/parse] Exception:', e);
    res.status(500).json({ error: 'Internal error' });
  }
}
