/* ============================================================================
   Where the console keeps things.

   Everything lives in this browser, under one key, and every read and write in
   the app goes through this file. That is deliberate: it is the seam. When
   there is a database behind this — and there will need to be, because a tool
   the salon shares cannot keep the content on Jess's laptop — `load` and `save`
   become two fetches and nothing else in the console changes.

   Until then the honest position is on screen, not buried here: the console
   says where the content is kept and gives you a file of it in one click.
   Content you cannot get out of a tool is content the tool owns.
   ========================================================================== */

const KEY = "bhh.console.v1";
const listeners = new Set();

/* ------------------------------------------------------------ the defaults --
   A new console is not empty. It opens knowing who Beauty Heaven are, because
   a brand brain full of placeholder text teaches the model nothing and a blank
   one makes the first thing you write sound like everybody else. Every word
   here came off the brand guidelines or the premises. */
export const SEED = {
  brand: {
    name: "Beauty Heaven Hub",
    what:
      "A destination salon and a professional academy under one roof, in Wombwell, Barnsley. " +
      "Beauty, hair, skin, aesthetics and wellness, plus accredited training for people who want " +
      "to do this for a living.",
    audience:
      "Mostly women, 25–55, local and travelling in. Many are nervous, and most are choosing on " +
      "trust rather than price. The academy side is career changers and existing therapists " +
      "levelling up.",
    voice:
      "Confident, warm, knowledgeable. Straightforward and reassuring rather than salesy. " +
      "Aspirational but never cold. We explain what happens before it happens. " +
      "We are premium, and premium means clear — not flowery.",
    treatments: [
      "Aesthetics — lip filler, anti-wrinkle, skin boosters",
      "Skin — facials, peels, microneedling",
      "Brows & lashes",
      "Nails",
      "Hair",
      "Wellness",
      "Academy — accredited beauty & aesthetics training",
    ],
    team: [
      "Jess — owner",
      "Hollie — aesthetics, consultations Tuesdays and Thursdays",
    ],
    offers: "",
    never: [
      "Indulge",
      "Pamper",
      "Elevate your",
      "We are delighted to announce",
      "Treat yourself, you deserve it",
      "Anything promising a guaranteed result",
      "Anything that sounds like a discount chain",
      "Clouds, angels, glitter or sparkle language",
    ],
    examples:
      "“I was nervous for my first treatment and they put me completely at ease. Everything was " +
      "explained before it happened.” — a first-time client",
  },

  /* The ideas board. Real ones: these are the questions the salon actually gets
     asked, which is where content should come from. */
  ideas: [
    { id: "i1", text: "A client asked if lip filler hurts — again.", source: "Front desk", used: false },
    { id: "i2", text: "Before and after: brow lamination, 6 weeks.", source: "Hollie", used: false },
    { id: "i3", text: "“Can I still have a facial if I'm pregnant?”", source: "WhatsApp", used: false },
    { id: "i4", text: "September academy intake is open.", source: "Jess", used: false },
  ],

  campaigns: [],
  calendar: [
    { id: "c1", day: "Mon", what: "Autumn skin reset — carousel", state: "scheduled" },
    { id: "c2", day: "Wed", what: "Academy: September intake open", state: "draft" },
    { id: "c3", day: "Fri", what: "Behind the arches — reel", state: "idea" },
  ],
};

let state = null;

function fresh() {
  return JSON.parse(JSON.stringify({ ...SEED, savedAt: null }));
}

export function load() {
  if (state) return state;
  try {
    const raw = localStorage.getItem(KEY);
    state = raw ? { ...fresh(), ...JSON.parse(raw) } : fresh();
  } catch {
    // A private window, cleared site data, or storage switched off. The console
    // still works for this session; it just will not remember.
    state = fresh();
  }
  return state;
}

export function save() {
  state.savedAt = new Date().toISOString();
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* out of quota or blocked — the screen keeps working, nothing is lost yet */
  }
  listeners.forEach((fn) => fn(state));
}

export function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/* ------------------------------------------------------------------ writes -- */
export function setBrand(patch) {
  Object.assign(load().brand, patch);
  save();
}

export function addIdea(text, source) {
  load().ideas.unshift({ id: uid(), text: text.trim(), source: source || "You", used: false });
  save();
}

/* An idea that has been written up stays on the board, greyed: the point of
   the list is to see which questions you have answered and which you have not,
   and deleting the answered ones loses exactly that. */
export function markIdeaUsed(text) {
  const idea = load().ideas.find((i) => i.text === text);
  if (idea) { idea.used = true; save(); }
}

export function removeIdea(id) {
  const s = load();
  s.ideas = s.ideas.filter((i) => i.id !== id);
  save();
}

export function saveCampaign(campaign) {
  const s = load();
  const i = s.campaigns.findIndex((c) => c.id === campaign.id);
  if (i >= 0) s.campaigns[i] = campaign;
  else s.campaigns.unshift(campaign);
  save();
  return campaign;
}

export function getCampaign(id) {
  return load().campaigns.find((c) => c.id === id) || null;
}

export function removeCampaign(id) {
  const s = load();
  s.campaigns = s.campaigns.filter((c) => c.id !== id);
  save();
}

/* A piece moves draft → waiting → approved. Nothing in this console publishes
   itself, and approved means a human read it, not that a model finished. */
export function setPieceState(campaignId, channel, pieceState) {
  const c = getCampaign(campaignId);
  if (!c || !c.pieces[channel]) return;
  c.pieces[channel].state = pieceState;
  c.pieces[channel].movedAt = new Date().toISOString();
  save();
}

/* A day, or null for "approved but not placed yet". Nothing picks a day on your
   behalf — a calendar that scatters work across the week by itself looks like a
   plan and is actually a shuffle. */
export function setPieceDay(campaignId, channel, day) {
  const c = getCampaign(campaignId);
  if (!c || !c.pieces[channel]) return;
  c.pieces[channel].day = day || null;
  save();
}

export function setPieceText(campaignId, channel, text) {
  const c = getCampaign(campaignId);
  if (!c || !c.pieces[channel]) return;
  c.pieces[channel].text = text;
  if (c.pieces[channel].state === "approved") c.pieces[channel].state = "waiting";
  save();
}

/* ------------------------------------------------------------------- reads -- */
export function waiting() {
  return load()
    .campaigns.flatMap((c) =>
      Object.entries(c.pieces)
        .filter(([, p]) => p.state === "waiting")
        .map(([channel, p]) => ({ campaign: c, channel, piece: p })),
    );
}

export function counts() {
  const all = load().campaigns.flatMap((c) => Object.values(c.pieces));
  return {
    campaigns: load().campaigns.length,
    pieces: all.length,
    waiting: all.filter((p) => p.state === "waiting").length,
    approved: all.filter((p) => p.state === "approved").length,
  };
}

/* --------------------------------------------------------- in and out again --
   The export is not a nice-to-have. It is the answer to "what happens to our
   content if this goes away", and the answer has to be "you already have it". */
export function exportAll() {
  return JSON.stringify(load(), null, 2);
}

export function importAll(text) {
  const next = JSON.parse(text);
  if (!next || typeof next !== "object" || !next.brand) throw new Error("That is not a console export.");
  state = { ...fresh(), ...next };
  save();
  return state;
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}
