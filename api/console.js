// =========================================================
// The Content Console — generation
//
// One endpoint behind every "write this" button in the console. The browser
// sends a brand profile and a brief; this streams back copy in that brand's
// voice. Server-side only, because a model key in the bundle is a free model
// for whoever opens devtools.
//
//   DEEPSEEK_API_KEY   Required. Without it this returns 503 and the console
//                      says so plainly rather than pretending to write.
//   DEEPSEEK_MODEL     Optional. Defaults to deepseek-chat.
//   DEEPSEEK_BASE_URL  Optional. Defaults to https://api.deepseek.com.
//
// Raw fetch rather than an SDK: DeepSeek speaks the OpenAI wire format, the
// other two functions in this folder are plain fetch against an edge runtime,
// and a dependency earns its place by doing something fetch cannot.
//
// Why one request per channel rather than one for the whole campaign:
//
//   - Each panel fills in on its own, so the screen is working rather than
//     spinning. That is the entire point of the feature.
//   - The system prompt is byte-identical across the six. DeepSeek caches
//     repeated prefixes automatically, so five of the six pay a fraction for
//     the part that matters — which is also why the brand goes in `system`
//     and the brief goes in the user turn, never mixed.
//   - A channel that fails fails alone. One long response that dies at 80%
//     loses everything.
//
// Streaming is not optional. A blog post at full length will outrun the
// function's time limit, and the response has to start arriving before it.
// =========================================================

/* The key, and where it was found.

   DEEPSEEK_API_KEY is the name this expects and the one the docs give. The
   variants are here because a key set under a near-miss name is indis-
   tinguishable, from the browser, from no key at all — and the failure it
   produces ("this deployment has no key") points at the wrong problem. The
   health check below reports which name actually matched, so a near-miss is
   visible rather than silently papered over. */
const KEY_NAMES = ["DEEPSEEK_API_KEY", "DEEPSEEK_API", "DEEPSEEK_KEY", "deepseek_API", "deepseek_api_key"];
function findKey() {
  for (const name of KEY_NAMES) {
    const v = process.env[name];
    if (v && v.trim()) return { key: v.trim(), name };
  }
  return { key: null, name: null };
}

const BASE = (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com").replace(/\/$/, "");
const MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";
const TEMPERATURE = 1.2;             // copy, not arithmetic — this wants some air
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
    maxTokens: 1600,
    brief:
      "A carousel of five slides. Give each slide a heading of no more than six words and one or two " +
      "sentences beneath it. Slide one earns the swipe, slide five says what to do next. " +
      "Then the caption, under 120 words, and 8–12 hashtags mixing the treatment, the town and the salon.",
  },
  blog: {
    label: "Blog post",
    maxTokens: 4000,
    brief:
      "An article of 700–1000 words answering the question properly, in Markdown. Open with the " +
      "reassurance, not with a definition. Use H2 subheadings a person would actually search for. " +
      "End with what happens at a consultation and how to book. Then, after a line of three dashes, " +
      "give a meta title under 60 characters and a meta description under 155.",
  },
  email: {
    label: "Email",
    maxTokens: 1400,
    brief:
      "A subject line under 45 characters, a preheader under 90 that does not repeat it, and a body " +
      "of 150–250 words. One idea, one call to action. Write the body as plain paragraphs — the " +
      "template puts the brand around it.",
  },
  whatsapp: {
    label: "WhatsApp reply",
    maxTokens: 700,
    brief:
      "The reply the salon would send if someone asked this on WhatsApp at nine in the evening. " +
      "Under 60 words, warm, no marketing language, and it ends by offering the next step rather " +
      "than demanding it. Then, on a new line after three dashes, three quick-reply button labels " +
      "of three words or fewer.",
  },
  website: {
    label: "Website answer",
    maxTokens: 900,
    brief:
      "The permanent answer to this on the treatment page: a heading in the customer's own words " +
      "and 80–120 words beneath it. This one is read by someone deciding, so it is plain and it " +
      "does not sell.",
  },
  reel: {
    label: "Reel script",
    maxTokens: 900,
    brief:
      "A 30-second script as a table of timecode, what is on screen, and what is said or captioned. " +
      "The first three seconds have to earn the rest. Then one line on what to film it with and where " +
      "in the building.",
  },
};

/* ------------------------------------------------------------------- VOICE --
   The part of the prompt that does not change between channels or between
   requests, and therefore the part the provider's prefix cache can reuse.
   Everything specific to this request goes in the user turn, after it. */
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
  about how you hope this helps. Do not wrap the whole answer in a code fence.`,
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
    return new Response(null, { status: 204, headers: { allow: "GET, POST, OPTIONS" } });
  }

  /* Is this deployment wired up? Names and settings only — never the key, and
     never a call to the provider, so it is free to hit and safe to leave open.
     It exists because "the console will not write" has two very different
     causes, and guessing between them from the browser wastes an afternoon. */
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (request.method === "GET") {
    const { key, name } = findKey();

    /* Which DeepSeek-ish variables this deployment can actually see, by NAME.
       Never a value, and nothing outside that filter — the point is to tell
       "the variable is missing" apart from "the variable is there under a name
       nothing is looking for", which from the outside look identical and have
       completely different fixes. envCount is here to prove process.env is
       populated at all, so an empty `seen` means the variable is absent rather
       than the environment being empty. */
    let seen = [];
    let envCount = 0;
    try {
      const keys = Object.keys(process.env || {});
      envCount = keys.length;
      seen = keys.filter((k) => /deep|seek/i.test(k)).sort();
    } catch {
      /* some runtimes do not allow enumerating the environment */
    }

    /* ?probe=1 goes one step further and actually calls the model — one token,
       the smallest question there is — because "the key is present" and "the
       key works" are different facts and only the second one matters. It is
       opt-in rather than part of the plain health check, since it costs a
       fraction of a penny and a health check should be free to hammer. */
    let probe = null;
    if (new URL(request.url).searchParams.get("probe") && key) {
      if (overLimit(ip)) {
        probe = { ok: false, message: "Rate limited locally. Wait a minute." };
      } else {
        try {
          const r = await fetch(`${BASE}/chat/completions`, {
            method: "POST",
            headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
            body: JSON.stringify({
              model: MODEL,
              max_tokens: 1,
              messages: [{ role: "user", content: "hi" }],
            }),
          });
          const body = await r.text();
          probe = {
            ok: r.ok,
            status: r.status,
            message: r.ok
              ? `${MODEL} answered. The key works.`
              : r.status === 401
                ? "The key was rejected by DeepSeek."
                : r.status === 402
                  ? "The key is valid but the DeepSeek account has no credit."
                  : r.status === 429
                    ? "Rate limited by DeepSeek."
                    : `DeepSeek returned ${r.status}: ${body.slice(0, 200)}`,
          };
        } catch (err) {
          probe = { ok: false, message: `Could not reach ${BASE}: ${err.message}` };
        }
      }
    }

    return json(
      {
        ok: true,
        configured: Boolean(name),
        keyFoundAs: name,
        looksFor: KEY_NAMES,
        seen,                                   // names only, never values
        envCount,
        vercelEnv: process.env.VERCEL_ENV || null,
        commit: (process.env.VERCEL_GIT_COMMIT_SHA || "").slice(0, 7) || null,
        model: MODEL,
        endpoint: BASE,
        probe,
        channels: Object.keys(CHANNELS),
      },
      200,
    );
  }

  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const { key, name: keyName } = findKey();
  if (!key) {
    // Deliberately loud. A console that silently returns nothing looks broken;
    // one that says it has no key tells whoever deployed it what to do.
    return json(
      {
        error: "not_configured",
        message:
          "No DeepSeek key is set on this deployment, so the console cannot write anything yet. " +
          `Looked for: ${KEY_NAMES.join(", ")}.`,
      },
      503,
    );
  }

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
  if (!channel) return json({ error: "unknown_channel", allowed: Object.keys(CHANNELS) }, 400);

  const brief = String(body.brief || "").slice(0, MAX_BRIEF).trim();
  if (!brief) return json({ error: "no_brief", message: "Nothing to write about." }, 400);

  const user =
    `${channel.brief}\n\n` +
    `THE BRIEF\n${brief}` +
    (body.context ? `\n\nCONTEXT THE SALON GAVE\n${String(body.context).slice(0, MAX_BRIEF)}` : "");

  let upstream;
  try {
    upstream = await fetch(`${BASE}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: MODEL,
        stream: true,
        temperature: TEMPERATURE,
        max_tokens: channel.maxTokens,
        messages: [
          { role: "system", content: systemPrompt(body.brand) },
          { role: "user", content: user },
        ],
      }),
    });
  } catch (err) {
    return json({ error: "upstream_unreachable", message: `Could not reach the model: ${err.message}` }, 502);
  }

  // Before a byte has been streamed a failure can still be a status code, and
  // a status code is what the console can show properly. After that it cannot.
  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    return json(
      {
        error: "upstream_error",
        message:
          upstream.status === 401
            ? `The DeepSeek key on this deployment (set as ${keyName}) was rejected.`
            : upstream.status === 402
              ? "The DeepSeek account has no credit left."
              : upstream.status === 429
                ? "Rate limited by DeepSeek. Wait a moment and run it again."
                : `DeepSeek returned ${upstream.status}. ${detail.slice(0, 300)}`,
      },
      upstream.status === 429 ? 429 : 502,
    );
  }

  /* Server-sent events in, plain text out. The console only ever wants the
     words, so the wire format stops here rather than being re-implemented in
     the browser. A chunk can split a line anywhere, hence the carry. */
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let carry = "";

  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body.getReader();
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          carry += decoder.decode(value, { stream: true });

          const lines = carry.split("\n");
          carry = lines.pop() ?? "";          // the last one may be half a line

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const payload = trimmed.slice(5).trim();
            if (payload === "[DONE]") continue;
            try {
              const delta = JSON.parse(payload)?.choices?.[0]?.delta?.content;
              if (delta) controller.enqueue(encoder.encode(delta));
            } catch {
              /* a keep-alive or a fragment that is not JSON — skip it */
            }
          }
        }
      } catch (err) {
        // The stream has already started, so this cannot become a status code.
        // It goes into the text, where the console shows it in place.
        controller.enqueue(encoder.encode(`\n\n[The connection dropped: ${err.message}]`));
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

// Same runtime as the other two functions in this folder. These handlers are
// web-standard (Request -> Response); Vercel's Node runtime would hand them
// (req, res) instead and they would throw on the first call.
export const config = { runtime: "edge" };
