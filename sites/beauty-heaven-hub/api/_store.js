// Conversation memory for the assistants.
//
// With SUPABASE_URL and SUPABASE_SERVICE_KEY set, every message is kept in
// the bot_messages table (see supabase/schema.sql): the record of what was
// said and agreed. Without them (early testing) it falls back to memory in
// the running function, which forgets now and then.
//
// A conversation is append-only: messages are never edited or trimmed,
// because the model's reasoning blocks are only valid in the exact history
// that produced them. Instead, a chat quiet for CONVO_HOURS starts a fresh
// conversation.

const CONVO_HOURS = 12;
const mem = new Map();

// Tolerates a pasted URL with a trailing slash or /rest/v1 on the end.
const baseUrl = () => (process.env.SUPABASE_URL || "").trim().replace(/\/+$/, "").replace(/\/rest\/v1$/, "");

function supa() {
  const url = baseUrl(), key = (process.env.SUPABASE_SERVICE_KEY || "").trim();
  if (!url || !key) return null;
  return (path, init = {}) =>
    fetch(`${url}/rest/v1/${path}`, {
      ...init,
      // Newer Supabase secret keys (sb_secret_...) go in apikey only; older
      // service_role keys are JWTs and also go in Authorization.
      headers: { apikey: key, ...(key.startsWith("eyJ") ? { Authorization: `Bearer ${key}` } : {}), "Content-Type": "application/json", ...(init.headers || {}) },
    });
}

// -> { convo, messages }
export async function loadConversation(channel, chat) {
  const db = supa();
  const fresh = () => ({ convo: `${channel}:${chat}:${Date.now()}`, messages: [] });
  if (!db) {
    const m = mem.get(`${channel}:${chat}`);
    if (!m || Date.now() - m.at > CONVO_HOURS * 3600e3) return fresh();
    return { convo: m.convo, messages: [...m.messages] };
  }
  const q = `bot_messages?channel=eq.${encodeURIComponent(channel)}&chat=eq.${encodeURIComponent(chat)}&order=id.desc&limit=1&select=convo,created_at`;
  const last = await (await db(q)).json();
  if (!Array.isArray(last) || !last.length || Date.now() - Date.parse(last[0].created_at) > CONVO_HOURS * 3600e3) return fresh();
  const rows = await (await db(`bot_messages?convo=eq.${encodeURIComponent(last[0].convo)}&order=id.asc&select=role,content`)).json();
  return { convo: last[0].convo, messages: rows.map((r) => ({ role: r.role, content: r.content })) };
}

export async function appendMessages(channel, chat, convo, added) {
  if (!added.length) return;
  const db = supa();
  if (!db) {
    const key = `${channel}:${chat}`;
    const m = mem.get(key)?.convo === convo ? mem.get(key) : { convo, messages: [] };
    m.messages.push(...added);
    m.at = Date.now();
    mem.set(key, m);
    return;
  }
  const res = await db("bot_messages", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(added.map((m) => ({ channel, chat: String(chat), convo, role: m.role, content: m.content }))),
  });
  if (!res.ok) console.error("store: HTTP", res.status, (await res.text()).slice(0, 200));
}

// For the setup check: can we reach the table? -> "ok" or the problem.
export async function storeStatus() {
  const db = supa();
  if (!db) return "not set up (memory only)";
  try {
    const res = await db("bot_messages?select=id&limit=1");
    if (res.ok) return "ok";
    return `HTTP ${res.status}: ${(await res.text()).slice(0, 120)} | ${describeKey()}`;
  } catch (e) {
    return `unreachable: ${e.message}`;
  }
}

// What kind of key is set, without revealing it: type, length, and for the
// older JWT keys the role and project it belongs to.
function describeKey() {
  const key = (process.env.SUPABASE_SERVICE_KEY || "").trim();
  const project = (baseUrl().match(/^https:\/\/([a-z0-9]+)\.supabase\.co/) || [])[1] || "unrecognised URL";
  let kind = key.startsWith("sb_secret_") ? "sb_secret key" : key.startsWith("sb_publishable_") ? "sb_publishable key (wrong one: that's the public key)" : key.startsWith("eyJ") ? "JWT key" : "unrecognised key";
  if (key.startsWith("eyJ")) {
    try {
      const claims = JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString());
      kind += `, role ${claims.role}, project ${claims.ref}`;
    } catch {
      kind += ", unreadable";
    }
  }
  return `key: ${kind}, ${key.length} characters; URL project: ${project}`;
}
