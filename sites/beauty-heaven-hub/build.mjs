// Builds the Beauty Heaven Hub website into sites/beauty-heaven-hub/public.
//
//   node sites/beauty-heaven-hub/build.mjs
//
// The treatment menu comes from Phorest's own service export
// (docs/beauty-heaven-hub/services-master.csv), so prices and durations are
// theirs, not retyped. Contact details and switches live in data/site.json.
// The look is the approved mock-up (public/goodwork/brands/beauty-heaven-hub/
// preview-8f3ac21d.html): the home page is that file, rewired, and every other
// page reuses its header, footer, type and components.
// Anything not yet confirmed is written with tbc(): while the site is
// unlaunched it shows as a yellow "to confirm" marker and is listed in
// CONTENT-TODO.md; once `launched` is true, any tbc() left fails the build.

import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const OUT = join(HERE, "public");
const BRAND = join(ROOT, "public/goodwork/brands/beauty-heaven-hub");
const CSV = join(ROOT, "docs/beauty-heaven-hub/services-master.csv");

const site = JSON.parse(readFileSync(join(HERE, "data/site.json"), "utf8"));
const groups = JSON.parse(readFileSync(join(HERE, "data/groups.json"), "utf8"));
const rules = JSON.parse(readFileSync(join(HERE, "data/booking-rules.json"), "utf8"));
const todo = new Set();

// ---------------------------------------------------------------- helpers --
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function tbc(text, page) {
  if (site.launched) throw new Error(`Unconfirmed content on ${page}: ${text}`);
  todo.add(`${page}: ${text}`);
  return `<span class="tbc">To confirm: ${esc(text)}</span>`;
}

function parseCsv(text) {
  const rows = [];
  let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n") { row.push(cell.replace(/\r$/, "")); rows.push(row); row = []; cell = ""; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows;
  const keys = head.map((h) => h.replace(/^﻿/, ""));
  return body.filter((r) => r.length > 1).map((r) => Object.fromEntries(keys.map((k, i) => [k, r[i] ?? ""])));
}

const money = (n) => {
  const v = Number(n);
  return "£" + v.toLocaleString("en-GB", { minimumFractionDigits: Number.isInteger(v) ? 0 : 2, maximumFractionDigits: 2 });
};
function duration(min) {
  const m = Number(min);
  if (!m) return "";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `${h} hr ${r} min` : `${h} hr`;
}
// Phorest names are typed by hand, some in capitals. Keep real acronyms,
// soften the rest, so "Polynucleotides EYES" reads "Polynucleotides Eyes".
const ACRONYMS = new Set(["HIFU", "PRP", "LVL", "EMH", "HD", "IPL", "RF", "LED", "SPMU", "BB"]);
const tidy = (s) =>
  s.replace(/\s+/g, " ").trim().replace(/\.$/, "")
    .replace(/\b(OR|AND|WITH)\b/g, (w) => w.toLowerCase())
    .replace(/\b[A-Z][A-Z]{2,}\b/g, (w) => (ACRONYMS.has(w) ? w : w[0] + w.slice(1).toLowerCase()));

const waLink = (text) => (site.whatsapp ? `https://wa.me/${site.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(text)}` : "");

// ------------------------------------------------------------------ data --
// Where the menu comes from. With Phorest credentials in the environment (the
// Vercel build has them), read the live menu straight from Phorest. Without
// them (a laptop, or this repo's sandbox, which cannot reach Phorest), fall
// back to the committed services export. Either way each service ends up in
// the same shape.
const MODEL = /\bmodel\b/i;
const POM_CATEGORIES = /anti.?wrinkle|b12|slim jab|weight|wight loss/i;
const POM_NAMES = /botox|b-?tox|hyaluronidase|filler dissolving|dissolv|hayfever|slim jab|weight loss pen|\bb12\b/i;

async function fromPhorest() {
  const { PHOREST_USERNAME: user, PHOREST_PASSWORD: pass, PHOREST_BUSINESS_ID: biz } = process.env;
  if (!user || !pass || !biz) return null;
  const auth = "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
  const base = `https://platform.phorest.com/third-party-api-server/api/business/${biz}`;
  async function all(path, key) {
    const out = [];
    for (let page = 0; page < 30; page++) {
      const res = await fetch(`${base}${path}${path.includes("?") ? "&" : "?"}size=100&page=${page}`, { headers: { Authorization: auth, Accept: "application/json" } });
      if (!res.ok) throw new Error(`Phorest ${path}: HTTP ${res.status}`);
      const body = await res.json();
      out.push(...(body._embedded?.[key] || []));
      if (page + 1 >= (body.page?.totalPages ?? 1)) break;
    }
    return out;
  }
  const branches = await all("/branch", "branches");
  const byName = (re) => branches.find((x) => re.test(x.name || ""));
  const hub = byName(/hub/i), academy = byName(/academy/i);
  if (!hub) throw new Error("Phorest: no branch named Hub");
  const shape = (s) => ({
    Category: (s.categoryName || "").trim(),
    categoryId: s.categoryId,
    Service: (s.internetName || s.name || "").trim(),
    "Price £": s.price ?? 0,
    "From?": "",
    "Duration (min)": s.duration ?? "",
    "Online?": s.internetEnabled && !s.archived ? "Y" : "N",
    Flags: [MODEL.test(s.name || "") ? "student practical" : "", POM_CATEGORIES.test(s.categoryName || "") || POM_NAMES.test(s.name || "") ? "Prescription-only" : ""].filter(Boolean).join("; "),
    Type: /consult/i.test(s.name || "") ? "Consultation" : "",
    // for the booking page: who can do it, and at what price
    serviceId: s.serviceId,
    userPrices: s.userPrices || [],
    categoryPrices: s.staffCategories?.prices || [],
    disqualifiedStaff: s.disqualifiedStaff || [],
  });
  const hubServices = (await all(`/branch/${hub.branchId}/service`, "services")).map(shape);
  const academyServices = academy ? (await all(`/branch/${academy.branchId}/service`, "services")).map(shape) : [];
  // Staff: only what the public booking page already shows (first name) plus
  // the ids needed to match prices. Birth dates, contact details, tax and
  // payroll numbers are never kept.
  const hubStaff = (await all(`/branch/${hub.branchId}/staff`, "staffs"))
    .filter((p) => !p.archived && !p.hideFromOnlineBookings)
    .map((p) => ({ staffId: p.staffId, userId: p.userId, categoryId: p.staffCategoryId, name: (p.firstName || "").trim(), initial: (p.lastName || "").trim().charAt(0), disqualifiedServices: p.disqualifiedServices || [] }));
  return { source: "phorest", hubBranchId: hub.branchId, hubServices, academyServices, hubStaff };
}

const live = await fromPhorest().catch((e) => {
  // A live-data build must not quietly ship the old export.
  if (process.env.VERCEL) throw e;
  console.warn("Phorest unavailable, using the export:", e.message);
  return null;
});
const services = live ? live.hubServices : parseCsv(readFileSync(CSV, "utf8"));
const menuSource = live ? `Phorest, read live at build time on ${new Date().toISOString().slice(0, 10)}` : "the committed Phorest services export";
const hidden = site.hideServices || {};
for (const [name, why] of Object.entries(hidden)) todo.add(`hidden from the menu, "${name}": ${why}`);
const isPublic = (s) => s["Online?"] === "Y" && !/student practical/.test(s.Flags) && Number(s["Price £"]) > 0 && !hidden[s.Service.trim()];
const isPom = (s) => /Prescription-only/.test(s.Flags);
const inCategory = (s, c) => (live ? s.categoryId === c.phorest : s.Category === c.csv);

for (const g of groups) {
  for (const c of g.categories) {
    c.items = services.filter((s) => inCategory(s, c) && isPublic(s));
    c.pom = c.items.some(isPom);
    if (!services.some((s) => inCategory(s, c))) throw new Error(`No services found for category "${c.csv}"`);
  }
  for (const c of g.categories.filter((c) => c.hide)) todo.add(`hidden from the menu, ${c.title}: ${c.hide}`);
  g.categories = g.categories.filter((c) => !c.hide);
  g.count = g.categories.reduce((n, c) => n + c.items.length, 0);
}
const lowerFirst = (t) => (/^[A-Z][a-z]/.test(t) ? t[0].toLowerCase() + t.slice(1) : t);
// Courses: the Academy branch's own online menu when live, otherwise the
// Hub export's "Academy Courses" category.
// The Academy branch also holds treatments (its own anti-wrinkle, fillers,
// waxing and so on), so only its course categories count as courses.
const isCourseCategory = (s) => /course|academy/i.test(s.Category || "");
const academyCourses = live ? live.academyServices.filter(isCourseCategory) : [];
const courseSource = academyCourses.length ? academyCourses : services.filter((s) => s.Category === "Academy Courses");
if (live && live.academyServices.some((s) => !isCourseCategory(s) && s["Online?"] === "Y")) {
  todo.add("/academy/: the Academy branch in Phorest also sells treatments online (anti-wrinkle, fillers, Slim Jab, waxing and more). Is it a second treatment location, and should those appear on the site?");
}
// Who can do a service, and what they charge. Phorest's order of precedence:
// a price set for that person, then for their staff category, then the list
// price. Only people shown on online booking count.
function staffPrices(s) {
  if (!live) return [];
  return live.hubStaff
    .filter((p) => !p.disqualifiedServices.includes(s.serviceId) && !s.disqualifiedStaff.includes(p.staffId) && !s.disqualifiedStaff.includes(p.userId))
    .map((p) => ({
      id: p.staffId,
      price: s.userPrices.find((u) => u.userRef === p.userId)?.price ?? s.categoryPrices.find((c) => c.id === p.categoryId)?.price ?? Number(s["Price £"]),
    }));
}
const courses = courseSource.filter((s) => s["Online?"] === "Y" && !/student practical/.test(s.Flags) && Number(s["Price £"]) > 0 && !/consult/i.test(s.Service));

// ------------------------------------------------------------ the mock-up --
// The home page IS the approved mock-up. It is read from the brand kit on
// every build and only rewired: asset paths, real links, and the handful of
// lines we cannot stand behind. Every swap must match exactly, so if the
// mock-up changes underneath, the build stops rather than silently drifting.
const MOCKUP = join(BRAND, "preview-8f3ac21d.html");
const mock = readFileSync(MOCKUP, "utf8");
const mockCss = mock.match(/<style>\n([\s\S]*?)<\/style>/)[1];
const mockJs = mock.match(/<script>\n(\(function \(\) \{[\s\S]*?\}\)\(\);)\n<\/script>\s*<\/body>/)[1];

function swap(html, from, to, label) {
  const hit = typeof from === "string" ? html.includes(from) : from.test(html);
  if (!hit) throw new Error(`Mock-up changed: could not find "${label}"`);
  return typeof from === "string" ? html.split(from).join(to) : html.replace(from, to);
}

// Every "Book" button opens our own booking page; Phorest's page stays as the fallback.
const BOOK = "/book/";

function headTags({ path, title, description }) {
  const full = path === "/" ? `${site.name} | welcome to heaven.` : `${title} | ${site.name}`;
  return `<title>${esc(full)}</title>
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#746B60">
${site.launched ? `<link rel="canonical" href="${site.url}${path}">` : '<meta name="robots" content="noindex, nofollow">'}
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:title" content="${esc(full)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${site.url}/og.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/logo/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/logo/favicon-180.png">`;
}

const draftBar = () => (site.launched ? "" : '<div class="draftbar">Draft website, not live yet. Yellow notes mark details we still need to confirm.</div>');

const mark = (cls) => `<span class="bh-mark ${cls}" role="img" aria-hidden="true"><span class="bh-mark__fallback">beauty <b>heaven</b> hub</span></span>`;

// The mock-up's header and footer, pointed at real pages.
function header(onHome) {
  const t = onHome ? '#treatments" data-journey-link="treatments' : "/treatments/";
  const a = onHome ? '#academy" data-journey-link="academy' : "/academy/";
  const h = onHome ? "#" : "/#";
  const links = `<a href="${t}">Treatments</a>
      <a href="${a}">Academy</a>
      <a href="${h}hub">The Hub</a>
      <a href="${h}people">Jessica &amp; Hollie</a>
      <a href="${h}reviews">Reviews</a>`;
  return `<header class="nav" id="nav">
  <div class="wrap nav__in">
    <a href="${onHome ? "#top" : "/"}" aria-label="Beauty Heaven Hub, home">${mark("bh-mark--hover nav__mark")}</a>
    <nav class="nav__pill" aria-label="Primary">
      ${links}
    </nav>
    <a class="btn btn--fill" href="${BOOK}" data-gw-magnetic="0.25"><span>Book</span></a>
    <button class="nav__menu" type="button" aria-expanded="false" aria-controls="menu">Menu</button>
  </div>
  <div class="wrap"><div class="nav__panel" id="menu" hidden>
    ${links}
    <a href="/visit/">Find us</a>
  </div></div>
</header>`;
}

function footer() {
  const tlinks = groups.map((g) => `<li><a href="/treatments/${g.slug}/">${esc(g.name)}</a></li>`).join("");
  return `<footer class="footer" data-surface="espresso">
  <div class="wrap">
    <div class="footer__grid">
      <div>
        <a href="/" aria-label="Beauty Heaven Hub, home">${mark("bh-mark--gold bh-mark--glint footer__mark")}</a>
        <div class="world"><span class="bh-logo">beauty <b>heaven</b></span><span class="micro">Treatments</span></div>
        <div class="world"><span class="bh-logo">beauty <b>heaven</b></span><span class="micro">Academy</span></div>
      </div>
      <div><h4>Treatments</h4><ul>${tlinks}</ul></div>
      <div><h4>Academy</h4><ul><li><a href="/academy/">Courses</a></li><li><a href="/academy/#how">How it works</a></li><li><a href="/policies/#academy">Booking terms</a></li><li><a href="${site.instagram.academy}">Instagram</a></li></ul></div>
      <div><h4>Visit</h4><ul><li><a href="/visit/">Find us</a></li><li><a href="tel:${site.phoneHref}">${esc(site.phone)}</a></li>${site.whatsapp ? `<li><a href="${waLink("Hi Beauty Heaven")}">WhatsApp ${esc(site.whatsappDisplay || "")}</a></li>` : ""}<li><a href="/consultations/">Consultations</a></li><li><a href="/policies/">Booking policies</a></li><li><a href="${BOOK}">Book online</a></li></ul></div>
    </div>
    <div class="footer__base">
      <span>© <span id="year"></span> ${esc(site.company)}</span>
      <span><a href="/privacy/">Privacy</a> · <a href="${site.instagram.treatments}">Instagram</a> · <a href="${site.facebook}">Facebook</a></span>
    </div>
  </div>
</footer>`;
}

// The mock-up's closing band, reused at the foot of every page.
function closeBand(heading = "beauty, <b>your</b> way.") {
  return `<section class="close" data-surface="taupe" aria-labelledby="close-h">
  <div class="close__halo" aria-hidden="true"></div>
  <div class="wrap close__in">
    <p class="micro eyebrow" data-gw-reveal><span class="t">Ready when you are</span></p>
    <span class="bh-mark bh-mark--gold bh-mark--glint close__mark" role="img" aria-label="Beauty Heaven Hub" data-gw-reveal><span class="bh-mark__fallback">beauty <b>heaven</b> hub</span></span>
    <h2 id="close-h" class="display d1" data-gw-reveal="mask"><span class="mask">${heading}</span></h2>
    <div class="actions" data-gw-reveal>
      <a class="btn btn--fill gw-shimmer" href="${BOOK}" data-gw-magnetic="0.25"><span>Book a treatment</span> <span class="arr">→</span></a>
      <a class="btn" href="/academy/" data-gw-magnetic="0.25"><span>Enquire about a course</span></a>
    </div>
  </div>
</section>`;
}

function layout({ path, title, description, body, close = true }) {
  return `<!doctype html>
<html lang="en-GB" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${headTags({ path, title, description })}
<link rel="preload" as="font" type="font/woff2" href="/fonts/Jost-Light.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="/fonts/Jost-Bold.woff2" crossorigin>
<link rel="stylesheet" href="/brand.css">
<link rel="stylesheet" href="/motion/goodwork-motion.css">
<script src="/motion/goodwork-motion.js" defer></script>
<link rel="stylesheet" href="/mockup.css">
<link rel="stylesheet" href="/pages.css">
</head>
<body class="page">
${draftBar()}
<div class="cursor" aria-hidden="true"></div>
${header(false)}
<main id="top">
${body}
${close ? closeBand() : ""}
</main>
${footer()}
<script src="/mockup.js"></script>
</body>
</html>
`;
}

// Mock-up style page head: eyebrow, display heading, lede.
function pageHead(eyebrow, heading, lede, extra = "") {
  return `<section class="section page-head">
  <div class="wrap">
    <div class="stack">
      <p class="micro micro--gold eyebrow" data-gw-reveal><span class="t">${eyebrow}</span></p>
      <h1 class="display d2" data-gw-reveal="mask"><span class="mask">${heading}</span></h1>
      ${lede ? `<p class="lede" data-gw-reveal>${lede}</p>` : ""}
      ${extra}
    </div>
  </div>
</section>`;
}

// Ask-us button: WhatsApp once the number exists, the phone until then.
function ask(text, label, fill = false) {
  const wa = waLink(text);
  const cls = fill ? "btn btn--fill" : "btn";
  if (wa) return `<a class="${cls}" href="${wa}" data-gw-magnetic="0.25"><span>${esc(label)}</span></a>`;
  return `<a class="${cls}" href="tel:${site.phoneHref}" data-gw-magnetic="0.25"><span>Call ${esc(site.phone)}</span></a>`;
}

// ------------------------------------------------------------------ home --
function home() {
  let h = mock;
  const P = "/";
  h = swap(h, /<title>[\s\S]*?<link rel="apple-touch-icon" href="logo\/favicon-180\.png">/, headTags({ path: "/", title: "Home", description: "Beauty, hair, skin, aesthetics and wellness, and professional beauty education, under one roof in Hoddesdon. What are you here for?" }), "head");
  h = swap(h, "<html lang=\"en\"", "<html lang=\"en-GB\"", "html lang");
  h = swap(h, "photos/derived/", "/photos/", "photo paths");
  h = swap(h, 'src="photos/', 'src="/photos/', "other photo paths");
  h = swap(h, 'href="fonts/', 'href="/fonts/', "font paths");
  h = swap(h, 'href="brand.css"', 'href="/brand.css"', "brand.css");
  h = swap(h, "../../motion/", "/motion/", "motion paths");
  h = swap(h, /<style>\n[\s\S]*?<\/style>/, '<link rel="stylesheet" href="/mockup.css">\n<link rel="stylesheet" href="/pages.css">', "style block");
  h = swap(h, /<script>\n\(function \(\) \{[\s\S]*?\}\)\(\);\n<\/script>/, '<script src="/mockup.js"></script>', "script block");
  h = swap(h, "<body>\n", `<body>\n${draftBar()}\n`, "body");
  h = swap(h, /<header class="nav" id="nav">[\s\S]*?<\/header>/, header(true), "nav");

  // Treatments journey: the five discipline cards open the real menus.
  const cardLinks = { Beauty: "/treatments/brows-lashes-pmu/", Hair: "/treatments/hair/", Skin: "/treatments/skin/", Aesthetics: "/treatments/aesthetics/", Wellness: "/treatments/body/" };
  for (const [name, href] of Object.entries(cardLinks)) {
    h = swap(h, new RegExp(`<article class="card" data-gw-reveal><span class="rule"></span><h3>${name}</h3>([\\s\\S]*?)</article>`), `<a class="card" href="${href}" data-gw-reveal><span class="rule"></span><h3>${name}</h3>$1</a>`, `${name} card`);
  }
  h = swap(h, '<a class="btn btn--fill" href="#book" data-gw-reveal data-gw-magnetic="0.25"><span>Book a treatment</span>', '<a class="btn btn--fill" href="/treatments/" data-gw-reveal data-gw-magnetic="0.25"><span>See every treatment</span>', "treatments button");
  h = swap(h, /(<div class="journey__head">[\s\S]*?<\/div>\n    )(<div class="cards" data-gw-stagger>)/g, '$1<p class="swipe-hint phone-only">Swipe to see more</p>\n    $2', "swipe hints");
  // Unverified card lines: hair consultations and skin analysis are not confirmed.
  h = swap(h, '<span class="micro">Consultation included</span>', '<span class="micro">Cut, colour, treatments</span>', "hair micro");
  h = swap(h, '<span class="micro">Skin analysis first</span>', '<span class="micro">Facials, HIFU, peels</span>', "skin micro");

  // Academy journey: the real courses, not the prototype's placeholders.
  h = swap(h, '<a class="btn btn--fill" href="#book" data-gw-reveal data-gw-magnetic="0.25"><span>Find my training</span>', '<a class="btn btn--fill" href="/academy/" data-gw-reveal data-gw-magnetic="0.25"><span>Find my training</span>', "academy button");
  h = swap(h, "Small groups, real models, and Jessica and Hollie in the room.", "Hands-on practice on real models, with online study before you arrive.", "academy lede");
  h = swap(h, /(<section class="journey journey--academy[\s\S]*?)<div class="cards" data-gw-stagger>[\s\S]*?<\/div>\n    <aside class="reassure"/, `$1<div class="cards" data-gw-stagger>
      <a class="card" href="/academy/" data-gw-reveal><span class="rule"></span><h3>Foundation aesthetics</h3><p>Foundation anti-wrinkle and foundation dermal filler courses, with online pre-study before your classroom day.</p><span class="micro">Where aesthetics starts</span></a>
      <a class="card" href="/academy/" data-gw-reveal><span class="rule"></span><h3>Advanced aesthetics</h3><p>Advanced anti-wrinkle, advanced dermal filler and non-surgical rhinoplasty, building on a foundation course.</p><span class="micro">The next step</span></a>
      <a class="card" href="/academy/" data-gw-reveal><span class="rule"></span><h3>Semi-permanent make-up</h3><p>Lip blush, microblading and bespoke ombre brows, taught hands-on in a working salon.</p><span class="micro">Brows and lips</span></a>
    </div>
    <aside class="reassure"`, "academy cards");
  h = swap(h, "and we'll map the route. Payment plans are available, and every course includes support after you've finished.", "and we'll map the route.", "academy reassure");

  // People and reviews: keep the design, flag what must be approved.
  h = swap(h, '<div class="people__grid" data-gw-stagger>', `<p>${tbc("Jessica and Hollie's photos, titles and bios", P)}</p>\n    <div class="people__grid" data-gw-stagger>`, "people");
  h = swap(h, '<h2 id="rev-h" class="loved" data-loved>Loved by <b>hundreds</b> of clients.</h2>', `<h2 id="rev-h" class="loved" data-loved>Loved by <b>hundreds</b> of clients.</h2>\n    <p>${tbc("swap these paraphrased reviews for real ones, word for word, with permission, and check \"hundreds\"", P)}</p>`, "reviews");

  // Before your first visit: two answers corrected against Phorest.
  h = swap(h, "For skin and aesthetics, yes, always, and it's part of the appointment rather than an extra. For most beauty and hair treatments the conversation happens in the chair.", "For aesthetics, semi-permanent make-up and some skin treatments, yes. Some consultations are free and some have a small fee, and we'll tell you which when you book. For most beauty and hair treatments the conversation happens in the chair.", "consultation answer");
  h = swap(h, "With a foundation course, and a conversation with Jessica or Hollie about where you'd like to end up. Every route through the Academy starts from nothing, and every course comes with support after you've qualified.", "With a conversation about where you are now and where you'd like to end up. We'll tell you which course fits, and anything you need before you start.", "academy answer");

  // The closing band's two buttons go somewhere real.
  h = swap(h, '<a class="btn btn--fill gw-shimmer" href="#" data-gw-magnetic="0.25"><span>Book a treatment</span>', `<a class="btn btn--fill gw-shimmer" href="${BOOK}" data-gw-magnetic="0.25"><span>Book a treatment</span>`, "close book");
  h = swap(h, '<a class="btn" href="#" data-gw-magnetic="0.25"><span>Enquire about a course</span>', '<a class="btn" href="/academy/" data-gw-magnetic="0.25"><span>Enquire about a course</span>', "close enquire");

  h = swap(h, /<footer class="footer" data-surface="espresso">[\s\S]*?<\/footer>/, footer(), "footer");
  return h;
}

// ---------------------------------------------------------------- menus --
function itemRow(s, showPrice, bookable = false) {
  const d = duration(s["Duration (min)"]);
  // Where the price depends on who does it, show the lowest as "from".
  const each = bookable ? staffPrices(s).map((x) => x.price) : [];
  const varies = each.length > 1 && each.some((x) => x !== each[0]);
  const price = showPrice ? `${s["From?"] || varies ? "from " : ""}${money(varies ? Math.min(...each) : each[0] ?? s["Price £"])}` : "";
  const name = bookable && s.serviceId ? `<a href="/book/?s=${esc(s.serviceId)}">${esc(tidy(s.Service))}</a>` : esc(tidy(s.Service));
  return `<li><span class="n">${name}</span>${d ? `<span class="d">${d}</span>` : ""}<span class="p">${price}</span></li>`;
}

function categoryBlock(c, page) {
  const showPrice = !c.pom || site.showPrescriptionOnlyPrices;
  const book = `/book/?c=${c.phorest}`;
  const notes = [];
  if (c.consult) notes.push(`<p class="note">A consultation comes first, so we can make sure this is right for you.${c.pom && !showPrice ? " Prices are given at your consultation." : ""}</p>`);
  if (c.patch) notes.push(`<p class="note">A patch test is needed before your first treatment.</p>`);
  if (c.decide) notes.push(`<p>${tbc("keep this on the website?", page)}</p>`);
  const rows = c.items.map((s) => itemRow(s, showPrice, true));
  // Long sections show six, the rest behind "Show all", so a phone isn't a
  // wall of prices.
  const list = rows.length > 8
    ? `<ul class="items">${rows.slice(0, 6).join("")}</ul><details class="more"><summary>Show all ${rows.length}</summary><ul class="items">${rows.slice(6).join("")}</ul></details>`
    : `<ul class="items">${rows.join("")}</ul>`;
  return `<section class="menu" id="${c.phorest}" data-gw-reveal>
    <div class="menu__head"><span class="rule"></span><h2>${esc(c.title)}</h2></div>
    ${notes.join("")}
    ${rows.length ? list : "<p>Ask us for times and prices.</p>"}
    <div class="actions">
      <a class="btn btn--fill" href="${book}" data-gw-magnetic="0.25"><span>Book ${esc(lowerFirst(c.title))}</span> <span class="arr">→</span></a>
      ${c.consult ? ask(`Hi Beauty Heaven, I'd like to book a consultation for ${lowerFirst(c.title)}`, "Ask about a consultation") : ""}
    </div>
  </section>`;
}

function treatmentsIndex() {
  const cards = groups.map((g) => `<a class="card" href="/treatments/${g.slug}/" data-gw-reveal><span class="rule"></span><h3>${esc(g.name)}</h3><p>${esc(g.line)}</p><span class="micro">${g.count} treatments</span></a>`).join("");
  return layout({
    path: "/treatments/", title: "Treatments",
    description: "The full Beauty Heaven Hub treatment menu: aesthetics, skin, brows and lashes, laser, hair, nails and body, with prices and online booking.",
    body: `${pageHead("Treatments", "beauty, <b>your</b> way.", "Choose a section to see every treatment, with times and prices straight from our booking system. Each one opens directly into the diary.")}
<section class="section" style="padding-top:0"><div class="wrap">
  <p class="swipe-hint phone-only">Swipe to see more</p>
  <div class="cards" data-gw-stagger>${cards}</div>
  <aside class="reassure" data-gw-reveal><div class="halo-dot" aria-hidden="true"></div><p><strong>First time?</strong> That's most people, once. We'll talk you through what happens before it happens, and you can stop and ask anything at any point.</p></aside>
</div></section>`,
  });
}

function groupPage(g) {
  const page = `/treatments/${g.slug}/`;
  const chips = g.categories.length > 1 ? `<nav class="chips" aria-label="Sections">${g.categories.map((c) => `<a href="#${c.phorest}">${esc(c.title)}</a>`).join("")}</nav>` : "";
  const pomNote = g.categories.some((c) => c.pom) ? `<p>${tbc("prescription-only treatments are listed by name, without prices; check the wording against the advertising rules before launch", page)}</p>` : "";
  return layout({
    path: page, title: g.name,
    description: `${g.name} at Beauty Heaven Hub, Hoddesdon. ${g.line}`,
    body: `${pageHead(`<a href="/treatments/">Treatments</a>`, esc(g.name), esc(g.line), pomNote + chips)}
<section class="section" style="padding-top:0"><div class="wrap menus">
  ${g.categories.map((c) => categoryBlock(c, page)).join("")}
  <p class="small">Prices and times come from our booking system and can change. The booking page always shows the current price.</p><!-- menu source: ${esc(menuSource)} -->
</div></section>`,
  });
}

// --------------------------------------------------------------- academy --
function academy() {
  // Grouped by the Academy's own categories, in the same list style as the
  // treatment menus, because the Academy branch runs to dozens of courses.
  const cats = [...new Set(courses.map((s) => s.Category || "Courses"))];
  const blocks = cats.map((cat) => {
    const rows = courses.filter((s) => (s.Category || "Courses") === cat).map((s) => itemRow(s, true));
    const list = rows.length > 8 ? `<ul class="items">${rows.slice(0, 6).join("")}</ul><details class="more"><summary>Show all ${rows.length}</summary><ul class="items">${rows.slice(6).join("")}</ul></details>` : `<ul class="items">${rows.join("")}</ul>`;
    return `<section class="menu" data-gw-reveal><div class="menu__head"><span class="rule"></span><h2>${esc(tidy(cat))}</h2></div>${list}<div class="actions">${ask(`Hi Beauty Heaven Academy, I'd like to know more about your ${tidy(cat)} courses`, "Ask about these courses")}</div></section>`;
  }).join("");
  return layout({
    path: "/academy/", title: "Academy",
    description: "Beauty and aesthetics courses at the Beauty Heaven Academy. Online pre-study, then hands-on training.",
    body: `${pageHead("Academy", "something for <b>your future.</b>", "Professional beauty and aesthetics education, taught in a working salon by people who do this every day. Hands-on practice on real models, with online study before you arrive.", `<div class="actions" data-gw-reveal>${ask("Hi Beauty Heaven Academy, I'd like to know more about your courses", "Ask about courses", true)}</div>`)}
<section class="section" style="padding-top:0"><div class="wrap">
  <p>${tbc("which courses are running now, and their dates", "/academy/")}</p>
  <div class="menus">${blocks}</div>
  <p>${tbc("entry requirements for each course, and who can enrol", "/academy/")}</p>
</div></section>
<section class="section alt" id="how"><div class="wrap">
  <div class="stack"><p class="micro micro--gold eyebrow" data-gw-reveal><span class="t">How it works</span></p><h2 class="display d2" data-gw-reveal="mask"><span class="mask">three <b>steps.</b></span></h2></div>
  <div class="cards steps" data-gw-stagger>
    <article class="card" data-gw-reveal><span class="rule"></span><h3>Ask</h3><p>Tell us which course you're interested in. We'll talk you through dates and anything you need before you start.</p></article>
    <article class="card" data-gw-reveal><span class="rule"></span><h3>Secure your place</h3><p>A 50% deposit holds your place, and we'll confirm by email.</p></article>
    <article class="card" data-gw-reveal><span class="rule"></span><h3>Study, then train</h3><p>You'll get a login for the online pre-study, to finish before your classroom day. It works on a computer or tablet, not a phone.</p></article>
  </div>
  <p>When you finish: ${tbc("what the certificate says and who issues it", "/academy/")}</p>
  <div class="actions"><a class="btn" href="/policies/#academy"><span>Academy booking terms</span></a></div>
</div></section>`,
  });
}

// ---------------------------------------------------------- consultations --
function consultations() {
  const rows = services
    .filter((s) => (s.Type === "Consultation" || /consult/i.test(s.Service)) && !/student practical/.test(s.Flags))
    .map((s) => `<li><span class="n">${esc(tidy(s.Service))}</span><span class="d">${esc(s.Category)}${s["Online?"] === "Y" ? " · book online" : " · by phone or message"}</span><span class="p">${Number(s["Price £"]) > 0 ? money(s["Price £"]) : "Free"}</span></li>`)
    .join("");
  return layout({
    path: "/consultations/", title: "Consultations",
    description: "Which treatments at Beauty Heaven Hub start with a consultation, what they cost and how to book one.",
    body: `${pageHead("Before your treatment", "we start with <b>a chat.</b>", "For aesthetic treatments, semi-permanent make-up and some skin treatments, we start with a consultation: what you'd like, whether it's right for you, and every question answered, with no pressure to go ahead.")}
<section class="section" style="padding-top:0"><div class="wrap menus">
  <section class="menu" data-gw-reveal>
    <div class="menu__head"><span class="rule"></span><h2>Consultations</h2></div>
    <ul class="items">${rows}</ul>
    <p>${tbc("whether consultation fees come off the treatment price", "/consultations/")}</p>
    <div class="actions">${ask("Hi Beauty Heaven, I'd like to book a consultation", "Book a consultation", true)}<a class="btn" href="${BOOK}"><span>Book online</span></a></div>
  </section>
  <section class="menu" data-gw-reveal>
    <div class="menu__head"><span class="rule"></span><h2>Patch tests</h2></div>
    <p>Lashes, laser and semi-permanent make-up need a patch test before your first treatment. We'll arrange it when you book.</p>
  </section>
</div></section>`,
  });
}

// ------------------------------------------------------------------ visit --
function visit() {
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Beauty Heaven Hub, " + site.address.join(", "))}`;
  const hours = site.hours.length ? `<dl class="facts">${site.hours.map(([d, t]) => `<div><dt class="micro">${esc(d)}</dt><dd>${esc(t)}</dd></div>`).join("")}</dl>` : `<p>${tbc("opening hours", "/visit/")}</p>`;
  return layout({
    path: "/visit/", title: "Find us",
    description: `Find Beauty Heaven Hub at ${site.address.join(", ")}. Opening hours, phone and directions.`,
    body: `<section class="section page-head"><div class="wrap visit">
  <div class="stack">
    <p class="micro micro--gold eyebrow" data-gw-reveal><span class="t">Visit</span></p>
    <h1 class="display d2" data-gw-reveal="mask"><span class="mask">find <b>us.</b></span></h1>
    <dl class="facts">
      <div><dt class="micro">Address</dt><dd>${site.address.map(esc).join("<br>")}${site.addressConfirmed ? "" : "<br>" + tbc("address", "/visit/")}</dd></div>
      <div><dt class="micro">Phone</dt><dd><a href="tel:${site.phoneHref}">${esc(site.phone)}</a></dd></div>
      <div><dt class="micro">WhatsApp</dt><dd>${site.whatsapp ? `<a href="${waLink("Hi Beauty Heaven")}">${esc(site.whatsappDisplay || "Message us")}</a>` : tbc("WhatsApp number (new number for the assistant)", "/visit/")}</dd></div>
      <div><dt class="micro">Email</dt><dd>${site.email && site.email !== "TBC" ? `<a href="mailto:${esc(site.email)}">${esc(site.email)}</a>` : tbc("main business email", "/visit/")}</dd></div>
    </dl>
    <div class="actions"><a class="btn btn--fill" href="${maps}"><span>Open in Google Maps</span> <span class="arr">→</span></a></div>
    <h2 class="sub">Opening hours</h2>
    ${hours}
    <p>${tbc("parking and getting here", "/visit/")}</p>
  </div>
  <div class="frame bh-cast visit__photo"><div class="halo" aria-hidden="true"></div><div class="photo photo--arch"><img src="/photos/salon-mirrors-376.webp" width="376" height="461" alt="The salon floor and its arched mirrors" loading="lazy"></div></div>
</div></section>`,
  });
}

// ---------------------------------------------------------------- policies --
function policies() {
  return layout({
    path: "/policies/", title: "Booking policies",
    description: "Deposits, cancellations and booking terms for treatments and Academy courses at Beauty Heaven Hub.",
    body: `${pageHead("The small print", "booking <b>policies.</b>", "")}
<section class="section" style="padding-top:0"><div class="wrap menus prose">
  <section class="menu"><div class="menu__head"><span class="rule"></span><h2>Treatments</h2></div>
    <p>${tbc("deposit, cancellation, late arrival and no-show rules for treatments", "/policies/")}</p>
    <p>Some treatments have age limits and need a consultation or patch test first. We'll tell you when you book.</p></section>
  <section class="menu" id="academy"><div class="menu__head"><span class="rule"></span><h2>Academy courses</h2></div>
    <ul class="plain">
      <li>A 50% deposit secures your place. We confirm by email.</li>
      <li>Classroom courses can be rescheduled up to 48 hours before the course date.</li>
      <li>To cancel a classroom course, tell us at least 15 working days before. A 30% admin fee applies. Cancellations made later than that are not refunded.</li>
      <li>Online distance courses have a 14-day cancellation right, refunded less a 25% admin fee, and no refund once your login details have been issued.</li>
    </ul>
    <p>${tbc("these Academy terms are taken from the current website; check they are still current", "/policies/")}</p></section>
  <section class="menu"><div class="menu__head"><span class="rule"></span><h2>Paying</h2></div>
    <p>${tbc("payment options to show (card, Klarna, finance, gift vouchers)", "/policies/")}</p></section>
</div></section>`,
  });
}

function privacy() {
  return layout({
    path: "/privacy/", title: "Privacy", close: false,
    description: "How Beauty Heaven Hub uses your personal information.",
    body: `${pageHead("Privacy", "your <b>information.</b>", "")}
<section class="section" style="padding-top:0"><div class="wrap prose">
  <p>${tbc("full privacy notice, to be written with the data agreement and checked before launch", "/privacy/")}</p>
  <p>${esc(site.company)} is responsible for the personal information you give us when you book, message or call.</p>
  <p>This website does not use advertising cookies. Bookings are handled by our booking system, Phorest, under its own privacy policy.</p>
</div></section>`,
  });
}

function notFound() {
  return layout({
    path: "/404", title: "Page not found", close: false,
    description: "That page isn't here.",
    body: pageHead("Not found", "that page isn't <b>here.</b>", "It may have moved when we rebuilt the website.", `<div class="actions"><a class="btn btn--fill" href="/treatments/"><span>See treatments</span></a><a class="btn" href="/"><span>Home</span></a></div>`),
  });
}

// ---------------------------------------------------------------- booking --
// Our own booking page. The build writes what it needs (treatments, who does
// them and their prices) to /book/services.json; free times are read live from
// Phorest by /api/availability. Confirming on the site stays off until the
// data agreement is signed and it has been tested on a dummy client, so for
// now the last step hands over to Phorest and no personal details leave the
// visitor's browser.
function bookingData() {
  if (!live) return { live: false, phorest: site.booking };
  const used = new Set();
  const out = groups.map((g) => ({
    name: g.name, slug: g.slug,
    cats: g.categories.filter((c) => c.items.some((s) => s.serviceId)).map((c) => {
      const showPrice = !c.pom || site.showPrescriptionOnlyPrices;
      // Can a client confirm this on the website, or does the team book it?
      const team = c.consult || c.pom || (rules.teamOnly || []).includes(c.title);
      return {
        id: c.phorest, title: c.title, consult: !!c.consult, patch: !!c.patch, deposit: !!(rules.deposits || {})[c.title],
        items: c.items.filter((s) => s.serviceId).map((s) => {
          const staff = staffPrices(s);
          staff.forEach((x) => used.add(x.id));
          return { id: s.serviceId, name: tidy(s.Service), mins: Number(s["Duration (min)"]) || null, price: showPrice ? Number(s["Price £"]) : null, confirm: !team && !isPom(s) && staff.length > 0, staff: staff.map((x) => [x.id, showPrice ? x.price : null]) };
        }),
      };
    }),
  }));
  const nobody = out.flatMap((g) => g.cats.filter((c) => c.items.some((s) => !s.staff.length)).map((c) => `${c.title} (${c.items.filter((s) => !s.staff.length).length})`));
  if (nobody.length) todo.add(`/book/: these treatments are online in Phorest but nobody who shows on online booking is set up to do them, so the booking page offers WhatsApp or a call instead of times: ${nobody.join(", ")}. Right person missing in Phorest, or should they come off the website?`);
  const people = live.hubStaff.filter((p) => used.has(p.staffId));
  const label = (p) => (people.filter((q) => q.name === p.name).length > 1 && p.initial ? `${p.name} ${p.initial}.` : p.name);
  // Booking rules, keyed by Phorest staff id and category id for the functions.
  const byName = (name) => people.filter((p) => p.name.toLowerCase() === name.toLowerCase() || label(p).toLowerCase() === name.toLowerCase());
  const peopleRules = {};
  for (const [name, r] of Object.entries(rules.people || {})) {
    const match = byName(name);
    if (match.length !== 1) throw new Error(`booking-rules.json: "${name}" matches ${match.length} people in Phorest (${people.map(label).join(", ")})`);
    peopleRules[match[0].staffId] = r;
  }
  const catIds = Object.fromEntries(groups.flatMap((g) => g.categories).map((c) => [c.title, c.phorest]));
  for (const t of [...Object.keys(rules.deposits || {}), ...(rules.teamOnly || [])]) if (!catIds[t]) throw new Error(`booking-rules.json: no treatment section called "${t}"`);
  const deposits = Object.fromEntries(Object.entries(rules.deposits || {}).filter(([, v]) => v).map(([t]) => [catIds[t], true]));
  if (!rules.confirmOnSite) todo.add("/book/: confirming a booking on the site is switched off (the last step offers WhatsApp or Phorest). Switch on after the data agreement is signed and a dummy-client test passes");
  if (!Object.keys(rules.people || {}).length && !Object.keys(rules.everyone || {}).length) todo.add("/book/: booking rules for each practitioner (earliest start, finish-by time, days, per-day exceptions), in data/booking-rules.json");
  if (!Object.keys(rules.deposits || {}).length) todo.add("/book/: which treatments need a deposit, in data/booking-rules.json (Phorest sets the amount)");
  return {
    live: true,
    branchId: live.hubBranchId,
    updated: new Date().toISOString(),
    confirmOnSite: !!rules.confirmOnSite,
    rules: { minNoticeHours: rules.minNoticeHours, maxDaysAhead: rules.maxDaysAhead, everyone: rules.everyone || {}, people: peopleRules, deposits },
    phorest: site.booking,
    whatsapp: (site.whatsapp || "").replace(/\D/g, ""),
    phone: site.phone,
    phoneHref: site.phoneHref,
    staff: Object.fromEntries(people.map((p) => [p.staffId, label(p)])),
    groups: out,
  };
}

function book() {
  return layout({
    path: "/book/", title: "Book online",
    description: "Book a treatment at Beauty Heaven Hub, Hoddesdon. Choose a treatment, who you'd like, and a time that suits you.",
    close: false,
    body: `${pageHead("Book online", "your <b>time.</b>", "Pick a treatment, who you'd like, and a time. The times are live from our diary.")}
<section class="section" style="padding-top:0"><div class="wrap">
  <div id="booker" class="booker" aria-live="polite"><p class="small">Loading treatments…</p></div>
  <noscript><p class="note">Booking needs JavaScript. You can <a href="${site.booking.home}">book on our booking partner's page</a> or call <a href="tel:${site.phoneHref}">${esc(site.phone)}</a>.</p></noscript>
  <p class="small booker__alt">Prefer to talk? Call <a href="tel:${site.phoneHref}">${esc(site.phone)}</a>${site.whatsapp ? ` or <a href="${waLink("Hi Beauty Heaven, I'd like to book")}">message us on WhatsApp</a>` : ""}.</p>
</div></section>
<script src="/book.js" defer></script>`,
  });
}

// ----------------------------------------------------------------- build --
function write(path, html) {
  const dir = join(OUT, path);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), html);
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

// Brand assets and the mock-up's own CSS and script, from their masters.
cpSync(join(BRAND, "brand.css"), join(OUT, "brand.css"));
writeFileSync(join(OUT, "mockup.css"), "/* Extracted from the approved mock-up (preview-8f3ac21d.html) by build.mjs. Edit the mock-up, not this file. */\n" + mockCss);
writeFileSync(join(OUT, "mockup.js"), "/* Extracted from the approved mock-up (preview-8f3ac21d.html) by build.mjs. Edit the mock-up, not this file. */\n" + mockJs + "\n");
cpSync(join(HERE, "src/pages.css"), join(OUT, "pages.css"));
mkdirSync(join(OUT, "motion"), { recursive: true });
for (const f of ["goodwork-motion.css", "goodwork-motion.js"]) cpSync(join(ROOT, "public/goodwork/motion", f), join(OUT, "motion", f));
mkdirSync(join(OUT, "fonts"), { recursive: true });
for (const f of ["Jost-Light", "Jost-Regular", "Jost-Medium", "Jost-Bold"]) {
  cpSync(join(BRAND, `fonts/${f}.woff2`), join(OUT, `fonts/${f}.woff2`));
  cpSync(join(BRAND, `fonts/${f}.ttf`), join(OUT, `fonts/${f}.ttf`));
}
mkdirSync(join(OUT, "logo"), { recursive: true });
for (const f of ["favicon.svg", "favicon-32.png", "favicon-180.png", "favicon-192.png", "favicon-512.png", "wordmark-mask.png"]) {
  cpSync(join(BRAND, `logo/${f}`), join(OUT, `logo/${f}`));
}
cpSync(join(BRAND, "photos/derived"), join(OUT, "photos"), { recursive: true, filter: (p) => !p.endsWith(".json") });
for (const f of ["academy-floor.jpg", "jessica.jpg", "hollie.jpg"]) {
  if (existsSync(join(BRAND, "photos", f))) cpSync(join(BRAND, "photos", f), join(OUT, "photos", f));
}
if (existsSync(join(BRAND, "og.jpg"))) cpSync(join(BRAND, "og.jpg"), join(OUT, "og.jpg"));

writeFileSync(join(OUT, "index.html"), home());
write("/treatments/", treatmentsIndex());
for (const g of groups) write(`/treatments/${g.slug}/`, groupPage(g));
write("/book/", book());
writeFileSync(join(OUT, "book/services.json"), JSON.stringify(bookingData()));
cpSync(join(HERE, "src/book.js"), join(OUT, "book.js"));
write("/academy/", academy());
write("/consultations/", consultations());
write("/visit/", visit());
write("/policies/", policies());
write("/privacy/", privacy());
writeFileSync(join(OUT, "404.html"), notFound());

const pages = ["/", "/book/", "/treatments/", ...groups.map((g) => `/treatments/${g.slug}/`), "/academy/", "/consultations/", "/visit/", "/policies/", "/privacy/"];
writeFileSync(join(OUT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((p) => `  <url><loc>${site.url}${p}</loc></url>`).join("\n")}\n</urlset>\n`);
writeFileSync(join(OUT, "robots.txt"), site.launched ? `User-agent: *\nAllow: /\nSitemap: ${site.url}/sitemap.xml\n` : "User-agent: *\nDisallow: /\n");

const lines = [...todo].sort();
writeFileSync(join(HERE, "CONTENT-TODO.md"), `# Beauty Heaven Hub website: still to confirm\n\nGenerated by build.mjs. Each line shows as a yellow note on the draft site. Fix it in data/site.json, data/groups.json or build.mjs, then rebuild.\n\n${lines.map((l) => `- ${l}`).join("\n")}\n`);

const listed = groups.reduce((n, g) => n + g.count, 0);
console.log(`Menu from ${menuSource}.`);
console.log(`Built ${pages.length} pages. ${listed} treatments listed, ${courses.length} courses. ${lines.length} items still to confirm.`);
