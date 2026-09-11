// =========================================================
// The Content Console — generation
//
// One endpoint behind every "write this" button in the console. The browser
// sends a brand profile and a brief; this streams back copy in that brand's
// voice. Server-side only, because an Anthropic key in the bundle is a free
// model for whoever opens devtools.
//
//   ANTHROPIC_API_KEY   Required. Without it this returns 503 and the console
//                       says so plainly rather than pretending to write.
//   CONSOLE_EFFORT      Optional. low | medium | high | xhigh | max.
//                       Defaults to medium: this is short-form copy in a fixed
//                       voice, not a reasoning problem, and medium keeps a
//                       serverless invocation inside its time limit.
//
// Why one request per channel rather than one for the whole campaign:
//
//   - Each panel fills in on its own, so the screen is working rather than
//     spinning. That is the entire point of the feature.
//   - The brand profile is identical across them and is cached, so five of the
//     six requests pay ~10% for the part that matters.
//   - A channel that fails fails alone. One long response that dies at 80%
//     loses everything.
//
// Streaming is not optional here. A blog post at full length will outrun both
// the SDK's HTTP timeout and the function's, and the response has to start
// arriving before either.
// =========================================================

import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-opus-5";
const MAX_BODY = 64 * 1024;          // a brand profile plus a brief; slack, not a target
const MAX_BRIEF = 4000;
const RATE_LIMIT = 30;               // per IP per window
const RATE_WINDOW = 60 * 1000;

/* ---------------------------------------------------------------- CHANNELS --
   Each channel is a shape, a length and a set of rules. They are here rather
   than in the browser so the console cannot be talked into ignoring them by
   editing a form field. */
const CHANNELS = {
  instagram: {
    label: "Instagram carousel",
    maxTokens: 3000,
    brief:
      "A carousel of five slides. Give each slide a heading of no more than six words and one or two " +
      "sentences beneath it. Slide one earns the swipe, slide five says what to do next. " +
      "Then the caption, under 120 words, and 8–12 hashtags mixing the treatment, the town and the salon.",
  },
  blog: {
    label: "Blog post",
    maxTokens: 8000,
    brief:
      "An article of 700–1000 words answering the question properly, in Markdown. Open with the " +
      "reassurance, not with a definition. Use H2 subheadings a person would actually search for. " +
      "End with what happens at a consultation and how to book. Then, after a line of three dashes, " +
      "give a meta title under 60 characters and a meta description under 155.",
  },
  email: {
    label: "Email",
    maxTokens: 3000,
    brief:
      "A subject line under 45 characters, a preheader under 90 that does not repeat it, and a body " +
      "of 150–250 words. One idea, one call to action. Write the body as plain paragraphs — the " +
      "template puts the brand around it.",
  },
  whatsapp: {
    label: "WhatsApp reply",
    maxTokens: 1500,
    brief:
      "The reply the salon would send if someone asked this on WhatsApp at nine in the evening. " +
      "Under 60 words, warm, no marketing language, and it ends by offering the next step rather " +
      "than demanding it. Then, on a new line after three dashes, three quick-reply button labels " +
      "of three words or fewer.",
  },
  website: {
    label: "Website answer",
    maxTokens: 2000,
    brief:
      "The permanent answer to this on the treatment page: a heading in the customer's own words " +
      "and 80–120 words beneath it. This one is read by someone deciding, so it is plain and it " +
      "does not sell.",
  },
  reel: {
    label: "Reel script",
    maxTokens: 2000,
    brief:
      "A 30-second script as a table of timecode, what is on screen, and what is said or captioned. " +
      "The first three seconds have to earn the rest. Then one line on what to film it with and where " +
      "in the building.",
  },
};

/* ------------------------------------------------------------------- VOICE --
   The part of the prompt that does not change between channels or between
   requests, and therefore the part worth caching. Everything specific to this
   request goes in the user turn, after the cache breakpoint. */
function systemPrompt(brand) {
  const b = brand || {};
  const list = (v) => (Array.isArray(v) ? v.filter(Boolean).join(", ") : String(v || "").trim());

  const sections = [
    `You write for ${b.name || "this business"}. Everything you produce goes out under their name,
so it has to sound like them and not like a marketing department.`,
  ];

  if (b.what) sections.push(`WHAT THEY ARE\n${b.what}`);
  if (b.audience) sections.push(`WHO THEY ARE TALKING TO\n${b.audience}`);
  if (b.voice) sections.push(`VOICE\n${b.voice}`);
  if (list(b.treatments)) sections.push(`WHAT THEY OFFER\n${list(b.treatments)}`);
  if (list(b.team)) sections.push(`THE TEAM\n${list(b.team)}`);
  if (b.offers) sections.push(`WHAT IS ON AT THE MOMENT\n${b.offers}`);
  if (list(b.never)) {
    sections.push(
      `NEVER SAY\nThese are not preferences. Do not use them, or anything that reads like them:\n` +
        list(b.never)
          .split(",")
          .map((s) => `- ${s.trim()}`)
          .join("\n"),
    );
  }
  if (b.examples) sections.push(`THEIR OWN WORDS, FOR THE SOUND OF IT\n${b.examples}`);

  sections.push(
    `HOW TO WRITE
- British English.
- Say the thing. No "we are delighted to announce", no "elevate your", no "indulge".
- Short sentences are allowed to be short.
- Never invent a price, a qualification, a result, a guarantee or a statistic. If a number would
  help and you have not been given it, leave a bracketed gap like [price] for a human to fill.
- Never claim a medical or clinical outcome.
- Write the thing asked for and nothing else. No preamble, no "here is your post", no sign-off
  about how you hope this helps.`,
  );

  return sections.join("\n\n");
}

/* ------------------------------------------------------------------- LIMITS --
   Best-effort only: serverless instances do not share memory, so this throttles
   a loop from one warm instance rather than a distributed flood. It is here to
   stop an accident costing money, not to stop an attacker. */
const hits = new Map();
function overLimit(ip) {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now - rec.start > RATE_WINDOW) {
    hits.set(ip, { start: now, n: 1 });
    if (hits.size > 5000) hits.clear();
    return false;
  }
  rec.n += 1;
  return rec.n > RATE_LIMIT;
}

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

export default async function handler(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: { allow: "POST, OPTIONS" },
    });
  }
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    // Deliberately loud. A console that silently returns nothing looks broken;
    // one that says it has no key tells whoever deployed it what to do.
    return json(
      {
        error: "not_configured",
        message:
          "ANTHROPIC_API_KEY is not set on this deployment, so the console cannot write anything yet.",
      },
      503,
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  if (overLimit(ip)) return json({ error: "rate_limited", message: "Too many requests. Wait a minute." }, 429);

  const raw = await request.text();
  if (raw.length > MAX_BODY) return json({ error: "too_large" }, 413);

  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: "bad_json" }, 400);
  }

  const channel = CHANNELS[body.channel];
  if (!channel) {
    return json({ error: "unknown_channel", allowed: Object.keys(CHANNELS) }, 400);
  }

  const brief = String(body.brief || "").slice(0, MAX_BRIEF).trim();
  if (!brief) return json({ error: "no_brief", message: "Nothing to write about." }, 400);

  const client = new Anthropic({ apiKey: key });
  const effort = process.env.CONSOLE_EFFORT || "medium";

  // The system prompt is the brand and does not change between the six channels
  // in a campaign, so it is cached. The first channel pays for it; the rest read
  // it back at about a tenth of the price.
  const system = [
    { type: "text", text: systemPrompt(body.brand), cache_control: { type: "ephemeral" } },
  ];

  const user =
    `${channel.brief}\n\n` +
    `THE BRIEF\n${brief}` +
    (body.context ? `\n\nCONTEXT THE SALON GAVE\n${String(body.context).slice(0, MAX_BRIEF)}` : "");

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const run = client.messages.stream({
          model: MODEL,
          max_tokens: channel.maxTokens,
          thinking: { type: "adaptive" },
          output_config: { effort },
          system,
          messages: [{ role: "user", content: user }],
        });

        for await (const event of run) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }

        const final = await run.finalMessage();
        if (final.stop_reason === "refusal") {
          controller.enqueue(
            encoder.encode("\n\n[This one was declined. Try wording the brief differently.]"),
          );
        }
      } catch (err) {
        // The stream has already started, so an error cannot become a status
        // code. It goes into the text where the console can show it in place.
        const msg =
          err instanceof Anthropic.RateLimitError
            ? "Rate limited by the API. Wait a moment and run it again."
            : err instanceof Anthropic.AuthenticationError
              ? "The API key on this deployment was rejected."
              : `Generation failed: ${err?.message || "unknown error"}`;
        controller.enqueue(encoder.encode(`\n\n[${msg}]`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      "x-accel-buffering": "no",
    },
  });
}

export const config = { runtime: "nodejs" };
