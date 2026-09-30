// One-off: point the Telegram bot at this deployment.
//
//   GET /api/telegram-setup/?key=<PHOREST_CHECK_KEY>
//
// Registers /api/telegram/ as the bot's webhook with a secret derived from
// the bot token, and reports the bot's username. 404 without the key.

import { webhookSecret } from "./_telegram.js";
import { storeStatus } from "./_store.js";

function sameKey(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || !b) return false;
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

export async function GET(request) {
  const url = new URL(request.url);
  if (!sameKey(url.searchParams.get("key") || "", process.env.PHOREST_CHECK_KEY || "")) return new Response("Not found", { status: 404 });
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const out = { anthropicKey: !!process.env.ANTHROPIC_API_KEY, supabase: await storeStatus(), allowed: (process.env.TELEGRAM_ALLOWED || "").split(",").filter(Boolean).length };
  if (!token) return Response.json({ ...out, telegram: "TELEGRAM_BOT_TOKEN is not set" });
  const call = async (m, body) => (await fetch(`https://api.telegram.org/bot${token}/${m}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body || {}) })).json();
  const me = await call("getMe");
  const hook = await call("setWebhook", { url: `${url.origin}/api/telegram/`, secret_token: webhookSecret(), allowed_updates: ["message"], drop_pending_updates: true });
  return Response.json({ ...out, bot: me.result?.username ? `@${me.result.username}` : me, webhook: hook.ok ? "set" : hook });
}
