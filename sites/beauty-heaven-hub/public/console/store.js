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
      "A destination salon and a professional academy under one roof, in Hoddesdon, Hertfordshire. " +
      "Beauty, hair, skin, aesthetics and wellness, plus hands-on professional training for people " +
      "who want to do this for a living.",
    audience:
      "Mostly women, 25–55, local and travelling in. Many are nervous, and most are choosing on " +
      "trust rather than price. The academy side is career changers and existing therapists " +
      "levelling up.",
    voice:
      "Confident, warm, knowledgeable. Straightforward and reassuring rather than salesy. " +
      "Aspirational but never cold. We explain what happens before it happens. " +
      "We are premium, and premium means clear — not flowery.",
    treatments: [
      "Aesthetics — dermal fillers, skin boosters, Profhilo, anti-wrinkle (consultation first)",
      "Skin — HIFU, specialist and Dermalogica facials, dermaplaning",
      "Brows, lashes & semi-permanent make-up",
      "Laser — hair removal and tattoo removal",
      "Hair",
      "Nails",
      "Body & wellness — massage, lymphatic drainage, body sculpting, waxing, tanning",
      "Academy — professional beauty & aesthetics courses, online pre-study then hands-on training",
    ],
    team: [
      "Jessica — co-owner",
      "Hollie — co-owner",
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
      "“Accredited” or “regulated” for the Academy, until it has been confirmed",
      "Any price, offer or promotion for a prescription-only treatment (anti-wrinkle injections, B12, weight-loss injections)",
    ],
    examples:
      "“I was nervous for my first treatment and they put me completely at ease. Everything was " +
      "explained before it happened.” — a first-time client",
  },

  /* The ideas board. Real ones: these are the questions the salon actually gets
     asked, which is where content should come from. */
  ideas: [
    { id: "i1", text: "A client asked if lip filler hurts — again.", source: "Front desk", used: false },
    { id: "i2", text: "What actually happens at a brow lamination appointment, start to finish.", source: "Hollie", used: false },
    { id: "i3", text: "“Can I still have a facial if I'm pregnant?”", source: "WhatsApp", used: false },
    { id: "i4", text: "Which Academy courses are running this term (dates to confirm).", source: "Jess", used: false },
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
  if (remote.ok !== false) push();
}

/* ------------------------------------------------------ the shared copy --
   On the salon's own site the console also keeps everything in the salon's
   database (/api/console-store/), so Jess, Hollie and Good Work see the same
   brand, ideas and approvals on any device. This browser keeps a copy, which
   is what the screen reads, so nothing waits on the network. Where there is
   no database (the Good Work demo), it quietly stays browser-only.

   Two people saving at once: the newer save wins. The server keeps a version
   number, so a stale save is noticed and the newer copy is taken rather than
   silently overwritten. */
const REMOTE = "/api/console-store/";
const remote = { ok: null, version: 0, pending: null, at: null };

function adopt(data) {
  state = { ...fresh(), ...data };
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* blocked */ }
  listeners.forEach((fn) => fn(state));
}

function push() {
  clearTimeout(remote.pending);
  remote.pending = setTimeout(async () => {
    remote.pending = null;
    try {
      const res = await fetch(REMOTE, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: remote.version, data: state }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.status === 409 && j.data) {
        // Someone else saved since we last looked. Keep whichever is newer.
        remote.version = j.version;
        if ((j.data.savedAt || "") > (state.savedAt || "")) adopt(j.data);
        else push();
        return;
      }
      if (!res.ok) { remote.ok = res.status === 404 ? false : remote.ok; return; }
      remote.ok = true;
      remote.version = j.version;
      remote.at = new Date().toISOString();
      listeners.forEach((fn) => fn(state));
    } catch {
      /* offline: this browser still has it, and the next save tries again */
    }
  }, 800);
}

/* Fetch the shared copy. -> "pulled" when it replaced what's on screen. */
export async function sync() {
  if (remote.ok === false || remote.pending) return "";
  try {
    const res = await fetch(REMOTE, { cache: "no-store" });
    if (!res.ok) { if (res.status === 404) remote.ok = false; return ""; }
    const j = await res.json();
    remote.ok = true;
    remote.version = j.version || 0;
    remote.at = new Date().toISOString();
    const mine = load();
    if (j.data && (!mine.savedAt || (j.data.savedAt || "") > mine.savedAt)) {
      adopt(j.data);
      return "pulled";
    }
    if (!j.data || (mine.savedAt || "") > (j.data.savedAt || "")) push();
  } catch {
    /* offline */
  }
  return "";
}

/* For "Where this is kept". */
export function where() {
  return { shared: remote.ok === true, checked: remote.ok !== null, at: remote.at };
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

/* Throw a piece away. An idea whose last piece has gone goes with it — an
   entry in the recent list with nothing behind it is just something to click
   on and be disappointed by. */
export function removePiece(campaignId, channel) {
  const c = getCampaign(campaignId);
  if (!c || !c.pieces[channel]) return;
  delete c.pieces[channel];
  if (Object.keys(c.pieces).length === 0) removeCampaign(c.id);
  else save();
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
