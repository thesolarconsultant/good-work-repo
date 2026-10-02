/* ============================================================================
   Does the console still write well?

   Point it at a deployment and it runs a battery of real briefs through the
   real endpoint, then reports the things that are cheap to check mechanically:
   length against the channel's own limit, bracketed gaps left rather than
   filled, banned words, and a last line that parses.

   It does not score the writing. Nothing does. Read the output — it prints in
   full, and that is the point. This exists so a change to the brand brain or a
   prompt cannot quietly make everything worse without anyone noticing.

     node scripts/console-eval.mjs https://your-deployment.vercel.app
     node scripts/console-eval.mjs https://… "?_vercel_share=TOKEN"
   ========================================================================== */

const BASE = (process.argv[2] || "").replace(/\/$/, "");
const SHARE = process.argv[3] || "";
if (!BASE) {
  console.error("Usage: node scripts/console-eval.mjs <deployment-url> [?_vercel_share=…]");
  process.exit(1);
}

/* A sample brand profile, shaped the way a console sends one. The example
   business is the one the site's own illustrations use. */
const brand = {
  name: "Northline Cleaning",
  what: "Commercial cleaning for offices, shops and shared buildings across Manchester.",
  audience: "Office managers and small business owners. Most have been let down by a cleaner before, " +
    "and are choosing on reliability rather than price.",
  voice: "Plain, capable and calm. Straightforward and reassuring rather than salesy. " +
    "We explain what happens before it happens.",
  services: ["Daily office cleaning", "Deep cleans", "Window cleaning", "Carpet and upholstery", "Washroom supplies"],
  team: ["Sam — owner", "Priya — operations, site visits Tuesdays and Thursdays"],
  never: ["Unlock", "Elevate your", "We are delighted to announce", "Sparkling", "Second to none"],
};

/* Each case exists to stress one thing. `cap` is the channel's own stated
   limit; `mustGap` means the brief withholds a fact on purpose and a good
   answer leaves a bracket rather than inventing one. */
const CASES = [
  { style: "myth", channel: "instagram", cap: 400,
    brief: "A customer asked if a weekly mop is enough to keep a carpeted office clean." },
  { style: "question", channel: "whatsapp", cap: 90,
    brief: "Do you bring your own equipment and products?" },
  { style: "happens", channel: "website", cap: 160,
    brief: "What actually happens at a first site visit." },
  { style: "news", channel: "email", cap: 260, mustGap: true,
    brief: "We now cover Leeds as well as Manchester.",
    context: "Starts the first Monday of next month. Same team, same prices." },
  { style: "aftercare", channel: "instagram", cap: 400,
    brief: "How to keep carpets looking clean between deep cleans." },
];

const words = (s) => (s.match(/[A-Za-z'’-]+/g) || []).length;

/* A closing line that does not parse undoes the whole piece, and it is the
   failure a high temperature produces most often. No parser here — just the
   shape of a finished sentence. */
function lastLineLooksFinished(text) {
  const lines = text.trim().split("\n").map((l) => l.trim()).filter(Boolean);
  const last = lines[lines.length - 1] || "";
  if (/^#|^\*\*|^[-–—]/.test(last)) return true;      // hashtags, a heading, a rule
  return /[.!?…)"”']$/.test(last) && words(last) >= 3;
}

const cookies = [];
async function get(url, opts = {}) {
  const res = await fetch(url, { ...opts, headers: { ...(opts.headers || {}), cookie: cookies.join("; ") }, redirect: "follow" });
  const set = res.headers.getSetCookie?.() || [];
  for (const c of set) cookies.push(c.split(";")[0]);
  return res;
}

if (SHARE) await get(BASE + "/" + SHARE);

const health = await (await get(`${BASE}/api/console?probe=1`)).json().catch(() => null);
if (!health?.configured) { console.error("Not configured:", health); process.exit(1); }
console.log(`${health.model} · ${health.commit} · ${health.probe?.message}\n`);

let failures = 0;
for (const c of CASES) {
  const res = await get(`${BASE}/api/console`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ channel: c.channel, style: c.style, brief: c.brief, context: c.context || "", brand }),
  });
  const text = (await res.text()).trim();

  const n = words(text);
  const banned = brand.never.filter((w) => new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(text));
  const gaps = text.match(/\[[a-z][^\]]{1,30}\]/gi) || [];

  const checks = [
    [n <= c.cap, `length ${n} / ${c.cap}`],
    [banned.length === 0, banned.length ? `banned: ${banned.join(", ")}` : "no banned words"],
    [lastLineLooksFinished(text), "last line finishes"],
    ...(c.mustGap ? [[gaps.length > 0, gaps.length ? `left gaps: ${gaps.join(" ")}` : "INVENTED — no gaps left"]] : []),
  ];

  const bad = checks.filter(([ok]) => !ok);
  failures += bad.length;
  console.log("═".repeat(72));
  console.log(`${c.style} · ${c.channel}  ${bad.length ? "✗" : "✓"}  ${checks.map(([ok, m]) => `${ok ? "✓" : "✗"} ${m}`).join("  ·  ")}`);
  console.log("═".repeat(72));
  console.log(text + "\n");
}

console.log(failures ? `\n${failures} check(s) failed.` : "\nAll checks passed. Now read the writing.");
process.exit(failures ? 1 : 0);
