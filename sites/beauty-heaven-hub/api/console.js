// The Content Console's writing, on Claude.
//
//   GET  /api/console/   health: is a key set, which model
//   POST /api/console/   { channel, style, brief, context, brand } -> the piece, streamed as plain text
//
// Same contract, channels, styles and brand rules as the Good Work demo's
// DeepSeek version (repo root api/console.js, where the rules live); only the
// model differs. Claude Opus 5.5 on the Anthropic API (ANTHROPIC_API_KEY, the
// key the receptionist uses; CONSOLE_MODEL overrides). The six pieces of a
// campaign are six requests sharing one byte-identical system prompt, which is
// cached. Refusals fall back server-side. Behind the console password.

import Anthropic from "@anthropic-ai/sdk";
import { CHANNELS, STYLES, DEFAULT_STYLE, systemPrompt, MAX_BODY, MAX_BRIEF } from "../../../api/console.js";

export const config = { maxDuration: 120 };

const MODEL = process.env.CONSOLE_MODEL || "claude-opus-5-5";
// Copy is worth some thought, but this is not a hard reasoning problem.
const EFFORT = process.env.CONSOLE_EFFORT || "medium";
// Thinking counts towards max_tokens, so leave room above each channel's length.
const THINKING_ROOM = 8000;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

export function GET() {
  return json({
    ok: true,
    configured: Boolean(process.env.ANTHROPIC_API_KEY),
    provider: "anthropic",
    model: MODEL,
    effort: EFFORT,
    channels: Object.keys(CHANNELS),
    styles: Object.keys(STYLES),
  });
}

export async function POST(request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return json({ error: "not_configured", message: "No Anthropic key is set on this deployment, so the console cannot write anything yet." }, 503);
  }
  const raw = await request.text();
  if (raw.length > MAX_BODY) return json({ error: "too_large" }, 413);
  let body;
  try { body = JSON.parse(raw); } catch { return json({ error: "bad_json" }, 400); }

  const channel = CHANNELS[body.channel];
  if (!channel) return json({ error: "unknown_channel", allowed: Object.keys(CHANNELS) }, 400);
  const style = STYLES[body.style] || STYLES[DEFAULT_STYLE];
  const brief = String(body.brief || "").slice(0, MAX_BRIEF).trim();
  if (!brief) return json({ error: "no_brief", message: "Nothing to write about." }, 400);

  // Same order as the DeepSeek version: form, then shape, then the subject.
  const user =
    `THE FORM\n${style.brief}\n\n` +
    `THE SHAPE\n${channel.brief}\n` +
    `Where the form and the shape pull against each other, the shape wins. Length and format ` +
    `are not negotiable.\n\n` +
    `THE BRIEF\n${brief}` +
    (body.context ? `\n\nCONTEXT THE SALON GAVE\n${String(body.context).slice(0, MAX_BRIEF)}` : "");

  const client = new Anthropic();
  let stream;
  try {
    stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: channel.maxTokens + THINKING_ROOM,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: EFFORT },
      system: [{ type: "text", text: systemPrompt(body.brand), cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: user }],
    });
  } catch (err) {
    return json({ error: "upstream_unreachable", message: `Could not reach Claude: ${err.message}` }, 502);
  }

  // Claude's events in, plain text out: the console only ever wants the words.
  const encoder = new TextEncoder();
  const out = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") controller.enqueue(encoder.encode("\n\n[Claude declined to write this one. Try rewording the brief.]"));
        if (final.stop_reason === "max_tokens") controller.enqueue(encoder.encode("\n\n[Cut off at the length limit.]"));
      } catch (err) {
        const status = err?.status;
        const why =
          status === 401 ? "The Anthropic key on this deployment was rejected." :
          status === 402 || /credit/i.test(err?.message || "") ? "The Anthropic account is out of credit." :
          status === 429 ? "Rate limited by Anthropic. Wait a moment and run it again." :
          `The connection dropped: ${err?.message || err}`;
        controller.enqueue(encoder.encode(`\n\n[${why}]`));
      } finally {
        controller.close();
      }
    },
  });
  return new Response(out, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-accel-buffering": "no" } });
}
