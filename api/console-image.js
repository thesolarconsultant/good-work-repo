// =========================================================
// The Content Console — pictures.
//
// The writing endpoint next door turns one idea into six pieces of copy. This
// turns a piece of copy into the photograph that goes with it, on Higgsfield,
// conditioned on a real photograph of the real salon.
//
//   HIGGSFIELD_API_KEY   Required, and it is a pair: "{key_id}:{key_secret}".
//                        Without it this returns 503 and says so.
//
// Two rules decide the shape of everything below, and both were learned the
// expensive way on this brand:
//
//   1. Generate people and light. Never generate the place. Every look here
//      passes a real photograph of a real room as the reference. A generated
//      building is worse than a stock photo, because a stock photo does not
//      claim to be theirs.
//
//   2. The prompt is not a text box. Three rounds of open prompting produced
//      three rounds of generic AI salon stock — the precise thing the brand
//      guidelines warn against, reached by a more expensive route. So the
//      looks live here, server-side, the same as the channels and the styles.
//      The browser chooses between them. It does not write them.
//
// The wire is a job queue, not a stream: POST creates a request and returns an
// id, GET polls it. That is Higgsfield's shape and there is no way around it —
// a picture takes tens of seconds and the console has to say so rather than
// pretending to be busy.
// =========================================================

export const config = { runtime: "edge" };

const BASE = (process.env.HIGGSFIELD_BASE_URL || "https://api.higgsfield.ai").replace(/\/$/, "");

/* Same forgiving lookup as the writing endpoint, for the same reason: a key
   set under a near-miss name is indistinguishable from no key at all, and the
   two have completely different fixes. */
const KEY_NAMES = [
  "HIGGSFIELD_API_KEY", "HIGGSFIELD_API", "HIGGSFIELD_KEY",
  "higgsfield_API", "higgsfield_api_key",
  "HF_API_KEY", "HF_KEY", "hf_API", "hf_api_key",
];
function findKey() {
  for (const name of KEY_NAMES) {
    const v = process.env[name];
    if (v && v.trim()) return { key: v.trim(), name };
  }
  return { key: null, name: null };
}

/* ------------------------------------------------------------------ GRADE --
   The part of every prompt that never changes: the brand's own guidelines,
   written as direction a photographer would recognise rather than as
   adjectives. One dominant soft source and no fill is the whole difference
   between this and the flat, evenly-lit look that makes salon photography
   read as a brochure. */
const GRADE =
  "Photographed, not illustrated. Editorial, quiet, expensive. " +
  "Palette: warm ivory, greige, deep espresso, soft stone, a little champagne gold — " +
  "the colours of the room in the reference, not a filter laid over them. " +
  "Lighting is the whole shot: one dominant soft source, placed and motivated; warm practical " +
  "lamps doing the work in the background; the shadow side left alone with no fill, so faces and " +
  "surfaces are modelled rather than flattened. Shallow depth of field. Fine film grain. " +
  "Nobody looks at the camera and nobody is grinning — absorbed beats posed.";

/* The lines. Not style preferences: a needle entering a face advertises a
   prescription-only medicine to the public, and two frames where the second
   looks better is a before-and-after however it is captioned. */
const NEVER =
  "No needles, syringes or injections of any kind. No before-and-after and nothing implying a " +
  "result. No text, lettering, words, numbers, watermarks or logos anywhere in frame. " +
  "No packaging with readable branding.";

/* -------------------------------------------------------------------ROOMS --
   Real photographs, served from this same deployment, so the reference and the
   console can never drift apart. Higgsfield fetches them by URL, which is why
   they are paths rather than uploads. */
const ROOMS = {
  treatmentRoom: "photos/treatment-room.jpg",
  reception: "photos/reception-wide.png",
  salonFloor: "photos/salon-mirrors.png",
  lounge: "photos/lounge-wings.png",
};
const PHOTO_BASE = "/goodwork/brands/beauty-heaven-hub/";

/* ------------------------------------------------------------------ LOOKS --
   Five, because five cover what a salon actually posts. Each is a sentence a
   photographer could shoot from, plus the room it is shot in. `subject` is the
   only part the brief gets to colour, and it arrives as a short phrase rather
   than as a prompt. */
const LOOKS = {
  // AI is for the close-ups a phone can't get: texture, detail, light. The
  // salon's own photos and clips carry everything else — the people, the
  // rooms, the real work — so no look here puts a person or a room in frame.
  texture: {
    label: "Texture, macro",
    room: "treatmentRoom",
    aspect: "9:16",
    scene:
      "An extreme macro of a product's texture, filling the frame: a slow swirl of cream, a single " +
      "drop of serum hanging from a glass dropper, the sheen of a gel polish. Nothing else in frame. " +
      "Lit from one side so every ripple catches the light. Unbranded, no packaging.",
  },
  lashbrow: {
    label: "Lashes and brows, close",
    room: "treatmentRoom",
    aspect: "9:16",
    scene:
      "An extreme close-up of one closed eye: the lash line, the brow above it, real skin texture " +
      "with fine lines and pores, unretouched. Calm, as if mid-treatment. No make-up drama, nothing " +
      "implying a before or after.",
  },
  hands: {
    label: "Hands at work",
    room: "treatmentRoom",
    aspect: "9:16",
    scene:
      "A close-up of a practitioner's gloved hands doing careful, precise work, and nothing else: a " +
      "brush laying down colour, tweezers lifting a single lash, a cloth pressed warm. Hands and tools " +
      "only, no face in frame. Absorbed and unhurried.",
  },
  tools: {
    label: "Tools, laid out",
    room: "treatmentRoom",
    aspect: "1:1",
    scene:
      "A close, overhead still life of a treatment set out ready: brushes, tweezers, small glass " +
      "dishes, folded towels, on a warm marble or linen surface. Clean, ordered, nothing branded. " +
      "One soft light from the side, deep shadow at the edge of frame.",
  },
  nails: {
    label: "Nails, macro",
    room: "treatmentRoom",
    aspect: "1:1",
    scene:
      "A macro of freshly finished nails resting on soft fabric: the shine of the top coat, the " +
      "clean cuticle line, one hand only, nothing else in frame. Warm, soft light.",
  },
  light: {
    label: "Light and atmosphere",
    room: "lounge",
    aspect: "9:16",
    scene:
      "An abstract, out-of-focus close-up of warm light: a lamp's glow, soft bokeh, a gold edge " +
      "catching it, the texture of linen or marble in the foreground. No people, nothing legible. " +
      "Made to sit behind words in a reel or explainer.",
  },
};

/* Which close-up a piece gets when nobody picks one. */
const STYLE_LOOK = {
  answer: "hands",
  myth: "texture",
  happens: "hands",
  question: "light",
  behind: "tools",
  aftercare: "texture",
  news: "light",
  academy: "tools",
};

const MAX_SUBJECT = 240;

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

function buildPrompt(look, subject) {
  const s = String(subject || "").slice(0, MAX_SUBJECT).trim();
  return [
    look.scene,
    s ? `It is illustrating this, so keep it relevant without illustrating it literally: ${s}` : "",
    GRADE,
    NEVER,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export default async function handler(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { allow: "GET, POST, OPTIONS" } });
  }

  const { key, name } = findKey();
  const url = new URL(request.url);

  /* ------------------------------------------------------------------ GET --
     Two jobs. With ?request= it polls; without, it is the same kind of health
     check the writing endpoint has, and for the same reason: "no pictures" has
     several causes and guessing between them from the browser wastes an hour. */
  if (request.method === "GET") {
    const id = url.searchParams.get("request");

    if (!id) {
      let seen = [];
      try {
        /* Wide on purpose. A key set as HF_KEY is invisible to a filter that
           only knows the word "higgsfield", and "the variable is missing" and
           "the variable is there under a name nothing looks for" are identical
           from out here and have completely different fixes. */
        seen = Object.keys(process.env || {}).filter((k) => /higgs|^hf[_-]/i.test(k)).sort();
      } catch {
        /* some runtimes will not enumerate the environment */
      }
      /* envCount proves the environment is populated at all, so an empty
         `seen` means the variable is genuinely absent from this build rather
         than the runtime refusing to enumerate. And a Vercel build cannot see
         a variable added after it was built, which is the usual answer. */
      let envCount = 0;
      try { envCount = Object.keys(process.env || {}).length; } catch { /* sealed */ }

      return json({
        ok: true,
        configured: Boolean(key),
        envCount,
        builtAt: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || null,
        /* Which environment this build belongs to, because a variable ticked
           for Production only is invisible to a preview and looks exactly like
           a variable that was never saved. Knowing this turns an afternoon of
           guessing into one glance. */
        vercelEnv: process.env.VERCEL_ENV || null,
        /* The shape of the value, never the value. Higgsfield authenticates
           with a pair — "Key {id}:{secret}" — and a key that is present but
           rejected is almost always half of one: the secret pasted on its own.
           From outside that is indistinguishable from a revoked key, and the
           two have nothing in common as fixes. Counting the colons settles it
           without anything sensitive leaving the server. */
        keyShape: key
          ? {
              parts: key.split(":").length,
              looksLikePair: key.split(":").length === 2 && key.split(":").every((p) => p.trim().length > 8),
              lengths: key.split(":").map((p) => p.trim().length),
            }
          : null,
        keyFoundAs: name,
        looksFor: KEY_NAMES,
        seen,
        endpoint: BASE,
        looks: Object.fromEntries(Object.entries(LOOKS).map(([k, v]) => [k, v.label])),
        styleLook: STYLE_LOOK,
      });
    }

    if (!key) return json({ error: "not_configured" }, 503);
    if (!/^[0-9a-f-]{16,64}$/i.test(id)) return json({ error: "bad_request_id" }, 400);

    const r = await fetch(`${BASE}/requests/${id}/status`, {
      headers: { authorization: `Key ${key}` },
    }).catch(() => null);

    if (!r) return json({ error: "upstream_unreachable" }, 502);
    if (!r.ok) return json({ error: "upstream_error", status: r.status }, 502);

    const body = await r.json();
    /* Handed back deliberately narrow: status, the pictures, and why it failed
       if it did. Nothing else in that payload is the console's business. */
    return json({
      status: body.status,
      images: (body.images || []).map((m) => m.url || m.raw?.url).filter(Boolean),
      error: body.error || null,
    });
  }

  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  if (!key) {
    return json(
      {
        error: "not_configured",
        message:
          "No Higgsfield key is set on this deployment, so no pictures can be made yet. " +
          `Looked for: ${KEY_NAMES.join(", ")}. It is a pair — {key_id}:{key_secret}.`,
      },
      503,
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "bad_json" }, 400);
  }

  const lookKey = LOOKS[body.look] ? body.look : STYLE_LOOK[body.style] || "treatment";
  const look = LOOKS[lookKey];

  /* The reference is resolved against whatever host this is running on, so a
     preview references the preview's photographs and production references
     production's. Hard-coding the live domain here would mean a preview
     silently generating against whatever the live site happened to be serving,
     which is exactly the sort of thing nobody notices for a month. */
  const origin = url.origin;
  const reference = `${origin}${PHOTO_BASE}${ROOMS[look.room]}`;

  const payload = {
    prompt: buildPrompt(look, body.subject),
    image_reference_url: reference,
    aspect_ratio: body.aspect && ["9:16", "16:9", "4:3", "3:4", "1:1", "2:3"].includes(body.aspect)
      ? body.aspect
      : look.aspect,
    resolution: "1080p",
    batch_size: 1,
    /* The reference is there for the room's colour and fittings, not to be
       copied. Too high and it returns the reference photograph with the light
       changed; too low and it forgets where it is. */
    style_strength: 0.6,
    enhance_prompt: false,
  };

  const r = await fetch(`${BASE}/higgsfield-ai/soul/reference`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Key ${key}` },
    body: JSON.stringify(payload),
  }).catch(() => null);

  if (!r) return json({ error: "upstream_unreachable", message: "Could not reach Higgsfield." }, 502);

  const text = await r.text();
  if (!r.ok) {
    /* Higgsfield answers "out of credit" with a 403, which reads as an auth
       failure and sent an hour down the wrong path. So the body decides here,
       not the status code — and the two are reported as the different problems
       they are, because one is fixed on a billing page and the other is not. */
    const broke = text.toLowerCase();
    const outOfCredit = broke.includes("not_enough_credits") || broke.includes("insufficient");

    return json(
      {
        error: outOfCredit ? "no_credit" : "upstream_error",
        message: outOfCredit
          ? "The Higgsfield platform API has no credit on it. That balance is separate from a " +
            "Plus or Pro subscription — topping up the subscription does not top this up. " +
            "It is bought against the API key at console.higgsfield.ai."
          : r.status === 401
            ? `Higgsfield rejected the key set as ${name}. It said: ${text.slice(0, 240) || "nothing"}`
            : `Higgsfield returned ${r.status}. ${text.slice(0, 300)}`,
      },
      outOfCredit ? 402 : r.status === 429 ? 429 : 502,
    );
  }

  let created;
  try {
    created = JSON.parse(text);
  } catch {
    return json({ error: "bad_upstream_json" }, 502);
  }

  return json({
    request_id: created.request_id || created.id,
    status: created.status || "queued",
    look: lookKey,
    lookLabel: look.label,
  });
}
