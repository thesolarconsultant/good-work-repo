// Telegram: the test channel for the receptionist (WhatsApp comes next).
//
//   POST /api/telegram/   Telegram's webhook, set up by /api/telegram-setup/
//
// Needs TELEGRAM_BOT_TOKEN and ANTHROPIC_API_KEY in Vercel. Only chats listed
// in TELEGRAM_ALLOWED (comma-separated chat ids) get the assistant; anyone
// else is told their chat id and nothing more, because a booking made here
// is real. TELEGRAM_HANDOVER_CHAT, if set, receives hand-over notes.

import { reply } from "./_brain.js";
import { startFresh } from "./_store.js";
import { webhookSecret } from "./_telegram.js";

export const config = { maxDuration: 60 };

const token = () => process.env.TELEGRAM_BOT_TOKEN || "";

async function tg(method, body) {
  const res = await fetch(`https://api.telegram.org/bot${token()}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json().catch(() => ({}));
}

async function send(chatId, text) {
  for (let i = 0; i < text.length; i += 3900) await tg("sendMessage", { chat_id: chatId, text: text.slice(i, i + 3900) });
}

const seen = new Set(); // Telegram retries; answer each update once

export async function POST(request) {
  if (!token() || request.headers.get("x-telegram-bot-api-secret-token") !== webhookSecret()) return new Response("Not found", { status: 404 });
  const update = await request.json().catch(() => null);
  const msg = update?.message;
  if (!msg?.chat?.id || seen.has(update.update_id)) return new Response("ok");
  seen.add(update.update_id);
  if (seen.size > 500) seen.clear();

  const chatId = String(msg.chat.id);
  const allowed = (process.env.TELEGRAM_ALLOWED || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!allowed.includes(chatId)) {
    await send(chatId, `This is a private test assistant. Your chat id is ${chatId}. Ask Good Work to add it.`);
    return new Response("ok");
  }
  if (!msg.text) {
    await send(chatId, "I can only read text messages for now.");
    return new Response("ok");
  }
  if (msg.text === "/new") {
    await startFresh("Telegram", chatId);
    await send(chatId, "Fresh start: I've forgotten this chat. How can I help?");
    return new Response("ok");
  }
  if (msg.text === "/start") {
    await send(chatId, "Hi! I'm the Beauty Heaven Hub assistant (an AI). Ask me about treatments, prices or free times, or book something in.");
    return new Response("ok");
  }

  await tg("sendChatAction", { chat_id: chatId, action: "typing" });
  const typing = setInterval(() => tg("sendChatAction", { chat_id: chatId, action: "typing" }), 4500);
  try {
    const answer = await reply({
      channel: "Telegram",
      chat: chatId,
      text: msg.text,
      origin: new URL(request.url).origin,
      handOver: async ({ reason, summary }) => {
        const to = process.env.TELEGRAM_HANDOVER_CHAT;
        if (to) await send(to, `Hand-over from the assistant (${reason}):\n${summary}\n\nChat: Telegram ${chatId}`);
      },
    });
    await send(chatId, answer);
  } catch (e) {
    console.error("telegram:", e.message);
    await send(chatId, "Sorry, something went wrong. Please try again, or call us.");
  } finally {
    clearInterval(typing);
  }
  return new Response("ok");
}
