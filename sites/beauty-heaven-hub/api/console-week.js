// The week's words, written by Claude.
//
//   POST /api/console-week/   { weekOf, brief, brand, posts: [{ id, style, day, photo }] }
//                             -> { posts: [{ id, eyebrow, headline, body, cta, steps, aftercareTitle, aftercare, caption }] }
//
// The console's This week screen sends the posts it wants written (all the
// unapproved ones, or one being rewritten) and gets the words back as JSON in
// the exact shape each content style draws. Same brand rules as the rest of
// the console (systemPrompt from the repo root api/console.js); the style and
// format rules for posts are below. Claude Opus 5.5 on the Anthropic API,
// structured output, refusals fall back server-side. Behind the console
// password (middleware.js).

import Anthropic from "@anthropic-ai/sdk";
import { systemPrompt, MAX_BRIEF } from "../../../api/console.js";

export const config = { maxDuration: 120 };

const MODEL = process.env.CONSOLE_MODEL || "claude-opus-5-5";
const EFFORT = process.env.CONSOLE_EFFORT || "medium";

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

const STYLES = {
  room: "THE ROOM: a reel cover over a slow film of one of the salon's rooms. eyebrow: which room (2-4 words). headline: one quiet line about the room or the feeling of being in it, 3-8 words. caption: 1-3 short sentences.",
  explainer: "CLOSE-UP EXPLAINER: a three-slide carousel about one treatment. eyebrow: 'Explained · ' + the treatment. headline: the question people actually have about it, 4-9 words. steps: exactly two, each a short title (2-4 words) and one or two plain sentences on what happens, before it happens. aftercareTitle: a short heading. aftercare: exactly four short practical lines, general and safe (no medical claims; these are checked by the practitioner before posting). caption: invites questions.",
  week: "THIS WEEK AT THE HUB: four of the week's own photos. eyebrow: 'This week at the Hub'. headline: 2-5 words. caption: 1-2 warm sentences about the week.",
  first: "FIRST TIME?: reassurance for someone nervous about their first treatment. eyebrow: 'First time?'. headline: 3-7 words, kind and plain. body: one sentence. caption: 2-3 sentences.",
  academy: "ACADEMY: a post for Beauty Heaven Academy, the training side. eyebrow: the course or topic. headline: 2-5 words. body: one or two sentences on what you learn or how it's taught. caption: 2-3 sentences ending with how to find out more.",
  story: "STORY: a single 9:16 story with one ask. eyebrow: the subject (1-3 words). headline: 3-6 words. cta: the ask, under 25 characters, e.g. 'Book · link in bio'. caption: empty string.",
};

const FORMAT = `HOW THE POSTS WORK
Each post is drawn into a fixed template in the brand, so the words must fit it.
- Headlines are lowercase, light, with ONE word or short phrase in bold marked with *asterisks*,
  e.g. "the quiet *before* it starts." They end with a full stop. Use "\\n" for a line break only
  where it reads better on two lines.
- The eyebrow is plain text, not bold, no asterisks.
- No emoji in headlines, eyebrows or bodies. At most one in a caption, and only if it earns it.
- Captions: British English, short sentences, end with 2-4 relevant hashtags on their own line.
- Fill every field in the schema. Fields a style doesn't use get an empty string or empty list.
- If the week's brief mentions something, use it where it fits naturally. Never invent offers,
  prices, dates or results; leave a [gap] instead.`;

const POST_SHAPE = {
  type: "object",
  properties: {
    id: { type: "string" },
    eyebrow: { type: "string" },
    headline: { type: "string" },
    body: { type: "string" },
    cta: { type: "string" },
    steps: {
      type: "array",
      items: {
        type: "object",
        properties: { title: { type: "string" }, text: { type: "string" } },
        required: ["title", "text"],
        additionalProperties: false,
      },
    },
    aftercareTitle: { type: "string" },
    aftercare: { type: "array", items: { type: "string" } },
    caption: { type: "string" },
  },
  required: ["id", "eyebrow", "headline", "body", "cta", "steps", "aftercareTitle", "aftercare", "caption"],
  additionalProperties: false,
};
const SCHEMA = {
  type: "object",
  properties: { posts: { type: "array", items: POST_SHAPE } },
  required: ["posts"],
  additionalProperties: false,
};

export async function POST(request) {
  if (!process.env.ANTHROPIC_API_KEY) return json({ error: "not_configured", message: "No Anthropic key is set on this deployment." }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ error: "bad_json" }, 400); }
  const posts = (Array.isArray(body.posts) ? body.posts : []).filter((p) => STYLES[p?.style]).slice(0, 12);
  if (!posts.length) return json({ error: "no_posts", message: "Nothing to write." }, 400);

  const brief = String(body.brief || "").slice(0, MAX_BRIEF).trim();
  const user =
    `Write the words for these posts for the week of ${String(body.weekOf || "this week").slice(0, 40)}.\n\n` +
    `THE WEEK'S BRIEF\n${brief || "(nothing in particular: write good, evergreen posts in the salon's voice)"}\n\n` +
    `THE POSTS (return one object per post, with the same id, in this order)\n` +
    posts.map((p) => `- id ${p.id} · ${p.day || ""} · ${STYLES[p.style]}${p.photo ? ` The picture: ${String(p.photo).slice(0, 80)}.` : ""}`).join("\n");

  const client = new Anthropic();
  let msg;
  try {
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: 32000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: EFFORT, format: { type: "json_schema", schema: SCHEMA } },
      system: [
        { type: "text", text: `${systemPrompt(body.brand)}\n\n${FORMAT}`, cache_control: { type: "ephemeral" } },
      ],
      messages: [{ role: "user", content: user }],
    });
    msg = await stream.finalMessage();
  } catch (err) {
    const why =
      err instanceof Anthropic.AuthenticationError ? "The Anthropic key on this deployment was rejected." :
      err instanceof Anthropic.RateLimitError ? "Rate limited by Anthropic. Wait a moment and try again." :
      err instanceof Anthropic.APIError && /credit/i.test(err.message) ? "The Anthropic account is out of credit." :
      `Could not reach Claude: ${err?.message || err}`;
    return json({ error: "upstream", message: why }, 502);
  }

  if (msg.stop_reason === "refusal") return json({ error: "refused", message: "Claude declined to write these. Try a different brief." }, 422);
  if (msg.stop_reason === "max_tokens") return json({ error: "too_long", message: "The reply ran over the length limit. Try fewer posts at once." }, 502);
  const text = msg.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  let out;
  try { out = JSON.parse(text); } catch { return json({ error: "bad_reply", message: "Claude's reply wasn't readable. Try again." }, 502); }
  const wanted = new Set(posts.map((p) => p.id));
  return json({ posts: (out.posts || []).filter((p) => wanted.has(p.id)) });
}
