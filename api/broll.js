// =========================================================
// Higgsfield B-roll — server-side proxy
//
// The site is a static build, so the Higgsfield credentials cannot live in
// the front end: anything in the bundle is readable by anyone who opens
// devtools, and video generation is billed per clip. This function is the
// only thing that ever sees the key.
//
// Contract (from the official SDK, github.com/higgsfield-ai/higgsfield-js):
//   base    https://platform.higgsfield.ai
//   auth    Authorization: Key <KEY_ID>:<KEY_SECRET>
//   start   POST /v1/image2video/dop
//           { model, prompt, input_images: [{ type: 'image_url', image_url }] }
//   poll    GET  /requests/{request_id}/status
//
// The SDK's withPolling blocks until the clip is done, which is minutes —
// far longer than any serverless timeout. So this starts the job and hands
// the id back, and the browser polls.
//
// Web-standard handler (Request -> Response): works as-is on Netlify
// Functions v2, Cloudflare Workers and Vercel Edge. For a Vercel Node
// function, wrap it — see README.
// =========================================================

const API_BASE = "https://platform.higgsfield.ai";

// The brand style file, baked into every prompt — the same idea the Content
// Console page describes. Retune this once and every preset changes with it.
const BRAND_STYLE = [
  "Shot on a full-frame cinema camera, 35mm, shallow depth of field.",
  "Natural British daylight, slightly overcast, cool neutral grade with clean whites.",
  "Slow deliberate camera movement. No whip pans, no speed ramps, no lens flares.",
  "Real UK residential and commercial settings. Documentary, not advertising.",
  "Avoid: stock-footage gloss, American suburbs, palm trees, glossy CGI, text overlays, people looking at camera.",
].join(" ");

// Prompts stay on the server. A public endpoint that generates video from
// arbitrary user text is a free video generator for whoever finds it, billed
// to us — so the browser only ever sends a preset id from this list.
//
// seedImage: replace these with real client stills before this goes live.
// They're currently site screenshots, which animate poorly — they exist so
// the wiring can be tested end to end.
const PRESETS = [
  {
    id: "rooftop",
    label: "Rooftop install",
    note: "A slow push across a finished domestic solar array.",
    prompt: "Slow forward push across a completed rooftop solar array on a British semi-detached house, panels catching flat morning light.",
    seedImage: "/case-studies/tsc-home.jpg",
    model: "dop-turbo",
  },
  {
    id: "warehouse",
    label: "Commercial roof",
    note: "A rising drone move over a warehouse install.",
    prompt: "Rising aerial drone move revealing a large-scale solar installation across a UK commercial warehouse roof, overcast sky.",
    seedImage: "/case-studies/8energy-home.jpg",
    model: "dop-turbo",
  },
  {
    id: "survey",
    label: "On the survey",
    note: "A handheld beat from a real site visit.",
    prompt: "Handheld documentary shot of an engineer checking readings on a domestic consumer unit during a home energy survey, natural window light.",
    seedImage: "/case-studies/8energy-solar.jpg",
    model: "dop-turbo",
  },
];

// ---------------------------------------------------------
// Best-effort throttling.
//
// This is per-instance memory: it resets on cold start and doesn't span
// concurrent instances, so treat it as a speed bump, not a budget. The
// control that actually protects the bill is a hard spend cap set on the
// Higgsfield account itself. Swap this for a KV/Redis counter if the demo
// ever gets real traffic.
// ---------------------------------------------------------
const WINDOW_MS = 60 * 60 * 1000;
const PER_IP_PER_HOUR = 3;
const TOTAL_PER_HOUR = 40;

const hits = new Map();
let recent = [];

function throttled(ip) {
  const now = Date.now();
  recent = recent.filter((t) => now - t < WINDOW_MS);
  if (recent.length >= TOTAL_PER_HOUR) return "busy";

  const mine = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (mine.length >= PER_IP_PER_HOUR) return "rate";

  mine.push(now);
  hits.set(ip, mine);
  recent.push(now);

  // Keep the map from growing without bound on a long-lived instance.
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
    }
  }
  return null;
}

function credentials() {
  // HF_CREDENTIALS is "KEY_ID:KEY_SECRET"; the split pair is also accepted.
  const combined = process.env.HF_CREDENTIALS;
  if (combined && combined.includes(":")) return combined;
  const id = process.env.HF_API_KEY;
  const secret = process.env.HF_API_SECRET;
  return id && secret ? `${id}:${secret}` : null;
}

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

// Vercel hands Node functions (req, res) but Edge functions a Request and
// expects a Response, which is what this is — so declare it. Ignored by
// Netlify Functions v2 and Cloudflare Workers, which are Web-standard
// already.
export const config = { runtime: "edge" };

export default async function handler(request) {
  const key = credentials();
  // Not configured is a normal state, not an error — the site is deployed
  // without this function far more often than with it, and the front end
  // hides the whole feature when it sees a 503.
  if (!key) return json({ error: "not_configured" }, 503);

  const url = new URL(request.url);
  const auth = { Authorization: `Key ${key}` };

  try {
    // ---- List presets. The browser uses this to decide whether to render
    // the panel at all, so it doubles as a health check.
    if (request.method === "GET" && !url.searchParams.get("id")) {
      return json({
        presets: PRESETS.map(({ id, label, note }) => ({ id, label, note })),
      });
    }

    // ---- Poll a job.
    if (request.method === "GET") {
      const id = url.searchParams.get("id");
      if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) return json({ error: "bad_id" }, 400);

      const res = await fetch(`${API_BASE}/requests/${id}/status`, { headers: auth });
      if (!res.ok) return json({ error: "upstream", status: res.status }, 502);
      const data = await res.json();

      // The SDK exposes isCompleted/isFailed/isNsfw over this payload; the
      // raw shape varies by model, so pull the URL defensively.
      const job = data.jobs?.[0] ?? data;
      const status = String(data.status ?? job.status ?? "").toLowerCase();
      const video =
        job.results?.raw?.url ?? job.results?.url ?? job.result?.url ?? null;

      if (job.is_nsfw || status === "nsfw") return json({ status: "failed", reason: "nsfw" });
      if (status.includes("fail") || status === "error") return json({ status: "failed" });
      if (video) return json({ status: "completed", url: video });
      return json({ status: status || "in_progress" });
    }

    // ---- Start a job.
    if (request.method === "POST") {
      const ip =
        request.headers.get("x-nf-client-connection-ip") ||
        request.headers.get("cf-connecting-ip") ||
        (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
        "unknown";

      const limited = throttled(ip);
      if (limited === "busy") return json({ error: "busy" }, 503);
      if (limited === "rate") return json({ error: "rate_limited" }, 429);

      const body = await request.json().catch(() => ({}));
      const preset = PRESETS.find((p) => p.id === body.presetId);
      if (!preset) return json({ error: "unknown_preset" }, 400);

      // Higgsfield fetches the seed image itself, so it has to be a public
      // absolute URL — this will not work against localhost.
      const origin = process.env.SITE_URL || url.origin;

      const res = await fetch(`${API_BASE}/v1/image2video/dop`, {
        method: "POST",
        headers: { ...auth, "content-type": "application/json" },
        body: JSON.stringify({
          model: preset.model,
          prompt: `${BRAND_STYLE} ${preset.prompt}`,
          input_images: [
            { type: "image_url", image_url: `${origin}${preset.seedImage}` },
          ],
        }),
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        console.error("higgsfield start failed", res.status, detail.slice(0, 400));
        return json({ error: "upstream", status: res.status }, 502);
      }

      const data = await res.json();
      const id = data.request_id ?? data.id;
      if (!id) return json({ error: "no_request_id" }, 502);
      return json({ id, status: data.status ?? "queued" });
    }

    return json({ error: "method_not_allowed" }, 405);
  } catch (error) {
    console.error("broll handler error", error);
    return json({ error: "server_error" }, 500);
  }
}
