// WhatsApp: the receptionist on the WhatsApp Business Platform (Cloud API).
//
//   GET  /api/whatsapp/   Meta's one-off webhook check (hub.verify_token)
//   POST /api/whatsapp/   incoming messages
//
// Environment (Vercel, Sensitive):
//   WHATSAPP_TOKEN            access token (a system user token for real use)
//   WHATSAPP_PHONE_NUMBER_ID  the sending number's id (Meta's test number first, then 07424 219417)
//   WHATSAPP_APP_SECRET       the Meta app's secret: every incoming call must be signed with it
//   WHATSAPP_VERIFY_TOKEN     any long random string, typed into Meta's webhook settings too
//   WHATSAPP_ALLOWED          optional, comma-separated numbers (447...). While set, only
//                             these get the assistant: for testing before launch.
//   WHATSAPP_HANDOVER_TO      optional, a number (447...) that gets hand-over notes.
//   WHATSAPP_GRAPH_VERSION    optional, defaults to v23.0.
//
// Meta wants a quick 200, so the reply is worked out after answering it
// (waitUntil). Meta can deliver the same message twice; each is answered once.

import { createHmac, timingSafeEqual } from "node:crypto";
import { waitUntil } from "@vercel/functions";
import { reply } from "./_brain.js";

export const config = { maxDuration: 60 };

const env = (k) => process.env[k] || "";
const graph = () => `https://graph.facebook.com/${env("WHATSAPP_GRAPH_VERSION") || "v23.0"}/${env("WHATSAPP_PHONE_NUMBER_ID")}`;

async function wa(body) {
  const res = await fetch(`${graph()}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env("WHATSAPP_TOKEN")}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", ...body }),
  });
  if (!res.ok) console.error("whatsapp send:", res.status, (await res.text()).slice(0, 300));
  return res.ok;
}
async function send(to, text) {
  for (let i = 0; i < text.length; i += 4000) await wa({ to, type: "text", text: { body: text.slice(i, i + 4000), preview_url: false } });
}

function signed(raw, header) {
  const secret = env("WHATSAPP_APP_SECRET");
  if (!secret || !header?.startsWith("sha256=")) return false;
  const want = Buffer.from(createHmac("sha256", secret).update(raw).digest("hex"));
  const got = Buffer.from(header.slice(7));
  return want.length === got.length && timingSafeEqual(want, got);
}

const seen = new Set();

export function GET(request) {
  const q = new URL(request.url).searchParams;
  const token = env("WHATSAPP_VERIFY_TOKEN");
  if (token && q.get("hub.mode") === "subscribe" && q.get("hub.verify_token") === token) return new Response(q.get("hub.challenge") || "");
  return new Response("Not found", { status: 404 });
}

async function handle(msg, origin) {
  const from = msg.from; // e.g. 447700900123
  const allowed = env("WHATSAPP_ALLOWED").split(",").map((s) => s.trim()).filter(Boolean);
  if (allowed.length && !allowed.includes(from)) return; // testing: leave everyone else to the team, untouched
  // Show it's been read, with the typing dots while the assistant works.
  await wa({ status: "read", message_id: msg.id, typing_indicator: { type: "text" } });
  if (msg.type !== "text") {
    await send(from, "Thanks! I can only read text messages for now. If you've sent a photo for a consultation, the team will ask for it when they get in touch.");
    return;
  }
  const answer = await reply({
    channel: "WhatsApp",
    chat: from,
    text: msg.text?.body || "",
    origin,
    handOver: async ({ reason, summary }) => {
      const to = env("WHATSAPP_HANDOVER_TO");
      if (to) await send(to, `Hand-over from the assistant (${reason}):\n${summary}\n\nClient's WhatsApp: +${from}`);
    },
  });
  await send(from, answer);
}

export async function POST(request) {
  const raw = await request.text();
  if (!signed(raw, request.headers.get("x-hub-signature-256"))) return new Response("Not found", { status: 404 });
  const body = JSON.parse(raw || "{}");
  const origin = new URL(request.url).origin;
  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value || {};
      if (value.metadata?.phone_number_id && value.metadata.phone_number_id !== env("WHATSAPP_PHONE_NUMBER_ID")) continue;
      for (const msg of value.messages || []) {
        if (seen.has(msg.id)) continue;
        seen.add(msg.id);
        if (seen.size > 1000) seen.clear();
        waitUntil(
          handle(msg, origin).catch(async (e) => {
            console.error("whatsapp:", e.message);
            await send(msg.from, "Sorry, something went wrong. Please try again, or call us.").catch(() => {});
          }),
        );
      }
    }
  }
  return new Response("ok");
}
