// Builds the Beauty Heaven Hub website into sites/beauty-heaven-hub/public.
//
//   node sites/beauty-heaven-hub/build.mjs
//
// The treatment menu comes from Phorest's own service export
// (docs/beauty-heaven-hub/services-master.csv), so prices and durations are
// theirs, not retyped. Contact details and switches live in data/site.json.
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

// Ask-us button: WhatsApp once the number exists, the phone until then.
function askButton(text, label = "Ask us on WhatsApp", cls = "btn--line") {
  const wa = waLink(text);
  if (wa) return `<a class="btn ${cls}" href="${wa}">${esc(label)}</a>`;
  return `<a class="btn ${cls}" href="tel:${site.phoneHref}">Call ${esc(site.phone)}</a>`;
}

// ------------------------------------------------------------------ data --
const services = parseCsv(readFileSync(CSV, "utf8"));
const hidden = site.hideServices || {};
for (const [name, why] of Object.entries(hidden)) todo.add(`hidden from the menu, "${name}": ${why}`);
const isPublic = (s) => s["Online?"] === "Y" && !/student practical/.test(s.Flags) && Number(s["Price £"]) > 0 && !hidden[s.Service.trim()];
const isPom = (s) => /Prescription-only/.test(s.Flags);

for (const g of groups) {
  for (const c of g.categories) {
    c.items = services.filter((s) => s.Category === c.csv && isPublic(s));
    c.pom = c.items.some(isPom);
    if (!services.some((s) => s.Category === c.csv)) throw new Error(`No services found for category "${c.csv}"`);
  }
  for (const c of g.categories.filter((c) => c.hide)) todo.add(`hidden from the menu, ${c.title}: ${c.hide}`);
  g.categories = g.categories.filter((c) => !c.hide);
  g.count = g.categories.reduce((n, c) => n + c.items.length, 0);
}
const lowerFirst = (t) => (/^[A-Z][a-z]/.test(t) ? t[0].toLowerCase() + t.slice(1) : t);
const courses = services.filter((s) => s.Category === "Academy Courses" && s["Online?"] === "Y");

// ---------------------------------------------------------------- layout --
const NAV = [
  ["/treatments/", "Treatments"],
  ["/academy/", "Academy"],
  ["/consultations/", "Consultations"],
  ["/visit/", "Visit us"],
];

const mark = (cls = "") => `<span class="bh-mark ${cls}" role="img" aria-label="beauty heaven hub"><span class="bh-mark__fallback">beauty <b>heaven</b> hub</span></span>`;

function layout({ path, title, description, body, bookbar = true }) {
  const full = path === "/" ? `${site.name} | Treatments and Academy, Hoddesdon` : `${title} | ${site.name}`;
  const nav = NAV.map(([href, label]) => `<a href="${href}"${path.startsWith(href) ? ' aria-current="page"' : ""}>${label}</a>`).join("");
  const bar = bookbar
    ? `<div class="bookbar"><a class="btn btn--gold" href="${site.booking.home}">Book online</a>${askButton("Hi Beauty Heaven, I have a question", "Message us", "btn--line\" style=\"color:var(--bh-ivory);border-color:var(--bh-stone)")}</div>`
    : "";
  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(full)}</title>
<meta name="description" content="${esc(description)}">
${site.launched ? `<link rel="canonical" href="${site.url}${path}">` : '<meta name="robots" content="noindex,nofollow">'}
<meta property="og:title" content="${esc(full)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta property="og:image" content="${site.url}/og.jpg">
<link rel="icon" href="/logo/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/logo/favicon-180.png">
<link rel="preload" href="/fonts/Jost-Light.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/brand.css">
<link rel="stylesheet" href="/site.css">
</head>
<body${bookbar ? ' class="has-bookbar"' : ""}>
<a class="skip" href="#main">Skip to content</a>
${site.launched ? "" : '<div class="draftbar">Draft website. Not live yet. Yellow notes mark details we still need to confirm.</div>'}
<header class="top">
  <div class="wrap top__in">
    <a class="top__logo" href="/">${mark("bh-mark--hover")}</a>
    <nav class="top__nav" aria-label="Main">${nav}<a class="btn btn--dark" style="min-height:40px;padding:8px 18px" href="${site.booking.home}">Book</a></nav>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="drawer">Menu</button>
  </div>
  <nav class="wrap drawer" id="drawer" aria-label="Main">${nav}<a href="${site.booking.home}">Book online</a></nav>
</header>
<main id="main">
${body}
</main>
<footer class="foot">
  <div class="wrap">
    <div class="foot__mark">${mark()}</div>
    <div class="foot__cols">
      <div>
        <h3>Visit</h3>
        <p>${site.address.map(esc).join("<br>")}${site.addressConfirmed ? "" : "<br>" + tbc("address", "footer")}</p>
        <p><a href="tel:${site.phoneHref}">${esc(site.phone)}</a></p>
      </div>
      <div>
        <h3>Explore</h3>
        <ul>${NAV.map(([h, l]) => `<li><a href="${h}">${l}</a></li>`).join("")}<li><a href="/policies/">Booking policies</a></li><li><a href="/privacy/">Privacy</a></li></ul>
      </div>
      <div>
        <h3>Follow</h3>
        <ul>
          <li><a href="${site.instagram.treatments}">Instagram: Treatments</a></li>
          <li><a href="${site.instagram.academy}">Instagram: Academy</a></li>
          <li><a href="${site.facebook}">Facebook</a></li>
        </ul>
      </div>
    </div>
    <p class="foot__small">${esc(site.company)}.</p>
  </div>
</footer>
${bar}
<script>
(function(){var b=document.querySelector('.menu-btn'),d=document.getElementById('drawer');if(!b||!d)return;
b.addEventListener('click',function(){var o=d.classList.toggle('open');b.setAttribute('aria-expanded',o);b.textContent=o?'Close':'Menu';});})();
</script>
</body>
</html>
`;
}

function write(path, html) {
  const dir = join(OUT, path);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), html);
}

const photo = (name, alt) => {
  const map = {
    "treatment-room": ["treatment-room-800.webp", 800, 640],
    "salon-mirrors": ["salon-mirrors-376.webp", 376, 461],
    "lounge-wings": ["lounge-wings-506.webp", 506, 458],
    "reception-portrait": ["reception-portrait-373.webp", 373, 452],
    "reception-wide": ["reception-wide-627.webp", 627, 376],
  };
  const [file, pw, ph] = map[name];
  return `<img src="/photos/${file}" width="${pw}" height="${ph}" alt="${esc(alt)}" loading="lazy">`;
};

// ------------------------------------------------------------------ pages --
function home() {
  const cards = groups
    .map((g) => `<a class="card" href="/treatments/${g.slug}/"><h3>${esc(g.name)}</h3><p>${esc(g.line)}</p></a>`)
    .join("");
  return layout({
    path: "/",
    title: "Home",
    description: "Beauty, aesthetics, hair, nails and professional training under one roof in Hoddesdon, Hertfordshire. Book online.",
    body: `
<section class="hero">
  <div class="wrap hero__grid">
    <div>
      <div class="hero__mark">${mark("bh-mark--glint")}</div>
      <h1>Treatments and training, under one roof.</h1>
      <p>Beauty, aesthetics, hair, nails and skin, and an Academy for people learning the craft. What are you here for?</p>
      <div class="fork">
        <a href="/treatments/"><b>I want a treatment</b><span>See the menu and book online.</span></a>
        <a href="/academy/"><b>I want to learn</b><span>Courses at the Beauty Heaven Academy.</span></a>
      </div>
    </div>
    <div class="hero__photo">${photo("reception-portrait", "The reception at Beauty Heaven Hub")}</div>
  </div>
</section>

<section class="sec">
  <div class="wrap">
    <p class="micro">Treatments</p>
    <h2>Find your <b>treatment</b></h2>
    <p class="lead">Every price and time on this site comes straight from our booking system, so what you see is what you book.</p>
    <div class="grid grid--3" style="margin-top:24px">${cards}</div>
  </div>
</section>

<section class="sec sec--alt">
  <div class="wrap">
    <p class="micro">Booking</p>
    <h2>How booking <b>works</b></h2>
    <ol class="steps">
      <li><h3>Choose</h3><p>Pick a treatment from the menu. Each section opens straight into its booking page.</p></li>
      <li><h3>Book</h3><p>Choose a time online. Some treatments need a deposit to secure your place.</p></li>
      <li><h3>Or ask first</h3><p>Not sure, or need a consultation first? Message or call us and we'll help.</p></li>
    </ol>
    <div class="btns"><a class="btn btn--gold" href="${site.booking.home}">Book online</a>${askButton("Hi Beauty Heaven, I'd like some advice before booking")}</div>
  </div>
</section>

<section class="sec sec--dark">
  <div class="wrap grid grid--2" style="align-items:center">
    <div>
      <p class="micro" style="color:var(--bh-stone)">Beauty Heaven Academy</p>
      <h2>Learn with <b>us</b></h2>
      <p>Courses in aesthetics and beauty, taught in the same building where our team works every day. Study starts online before your classroom day.</p>
      <div class="btns"><a class="btn btn--gold" href="/academy/">See the courses</a></div>
    </div>
    <div class="bh-arch" style="max-width:420px">${photo("lounge-wings", "Inside Beauty Heaven Hub")}</div>
  </div>
</section>

<section class="sec">
  <div class="wrap grid grid--2" style="align-items:center">
    <div class="bh-arch" style="max-width:520px">${photo("reception-wide", "The reception and lounge")}</div>
    <div>
      <p class="micro">Visit</p>
      <h2>Find <b>us</b></h2>
      <p>${site.address.map(esc).join(", ")}${site.addressConfirmed ? "" : " " + tbc("address and whether the Academy is at the same place", "home")}</p>
      <div class="btns"><a class="btn btn--line" href="/visit/">Directions and contact</a></div>
    </div>
  </div>
</section>`,
  });
}

function itemRow(s, showPrice) {
  const name = tidy(s.Service);
  const d = duration(s["Duration (min)"]);
  const price = showPrice ? `${s["From?"] ? "from " : ""}${money(s["Price £"])}` : "";
  return `<li><span class="n">${esc(name)}</span>${d ? `<span class="d">${d}</span>` : ""}<span class="p">${price}</span></li>`;
}

function categoryBlock(c, page) {
  const showPrice = !c.pom || site.showPrescriptionOnlyPrices;
  const book = `${site.booking.category}${c.phorest}`;
  const notes = [];
  if (c.consult) notes.push(`<div class="note">A consultation comes first, so we can make sure this is right for you. ${c.pom && !showPrice ? "Prices are given at your consultation." : ""}</div>`);
  if (c.patch) notes.push(`<div class="note">A patch test is needed before your first treatment.</div>`);
  if (c.decide) notes.push(`<div class="note">${tbc("keep this on the website?", page)}</div>`);
  const list = c.items.length > 12
    ? `<ul class="items">${c.items.slice(0, 10).map((s) => itemRow(s, showPrice)).join("")}</ul>
       <details class="more"><summary>Show all ${c.items.length}</summary><ul class="items">${c.items.slice(10).map((s) => itemRow(s, showPrice)).join("")}</ul></details>`
    : `<ul class="items">${c.items.map((s) => itemRow(s, showPrice)).join("")}</ul>`;
  const cta = c.consult
    ? `<div class="btns"><a class="btn btn--dark" href="${book}">Book ${esc(lowerFirst(c.title))}</a>${askButton(`Hi Beauty Heaven, I'd like to book a consultation for ${lowerFirst(c.title)}`, "Ask about a consultation")}</div>`
    : `<div class="btns"><a class="btn btn--dark" href="${book}">Book ${esc(lowerFirst(c.title))}</a></div>`;
  return `<section class="menu" id="${c.phorest}">
    <div class="menu__head"><h2>${esc(c.title)}</h2></div>
    ${notes.join("")}
    ${c.items.length ? list : `<p>Ask us for times and prices.</p>`}
    ${cta}
  </section>`;
}

function treatmentsIndex() {
  const body = groups
    .map((g) => `<a class="card" href="/treatments/${g.slug}/"><h3>${esc(g.name)}</h3><p>${esc(g.line)}</p><p class="card__meta">${g.categories.map((c) => esc(c.title)).join(" · ")}</p></a>`)
    .join("");
  return layout({
    path: "/treatments/",
    title: "Treatments",
    description: "The full Beauty Heaven Hub treatment menu: aesthetics, skin, brows and lashes, laser, hair, nails and body treatments, with prices and online booking.",
    body: `<section class="sec"><div class="wrap">
      <p class="micro">Treatments</p><h1>The <b>menu</b></h1>
      <p class="lead">Choose a section to see treatments, times and prices, then book straight into our diary.</p>
      <div class="grid grid--2" style="margin-top:24px">${body}</div>
      <div class="btns"><a class="btn btn--gold" href="${site.booking.home}">Browse everything in the booking system</a></div>
    </div></section>`,
  });
}

function groupPage(g) {
  const page = `/treatments/${g.slug}/`;
  const jump = g.categories.length > 1 ? `<nav class="jump" aria-label="Sections">${g.categories.map((c) => `<a href="#${c.phorest}">${esc(c.title)}</a>`).join("")}</nav>` : "";
  return layout({
    path: page,
    title: g.name,
    description: `${g.name} at Beauty Heaven Hub, Hoddesdon. ${g.line}`,
    body: `<section class="sec"><div class="wrap">
      <p class="micro"><a href="/treatments/">Treatments</a></p>
      <h1>${esc(g.name)}</h1>
      <p class="lead">${esc(g.line)}</p>
      ${g.categories.some((c) => c.pom) ? `<p>${tbc("prescription-only treatments are listed by name, without prices; check the wording against the advertising rules before launch", page)}</p>` : ""}
      ${jump}
      ${g.categories.map((c) => categoryBlock(c, page)).join("")}
      <p class="card__meta">Prices and times come from our booking system and can change. The booking page always shows the current price.</p>
    </div></section>`,
  });
}

function academy() {
  const list = courses
    .map((s) => `<div class="card"><h3>${esc(tidy(s.Service))}</h3><p>${duration(s["Duration (min)"]) ? `Course length: ${duration(s["Duration (min)"])}` : ""}</p><p><b>${money(s["Price £"])}</b></p><div class="btns">${askButton(`Hi Beauty Heaven Academy, I'd like to know more about the ${tidy(s.Service)}`, "Ask about this course")}</div></div>`)
    .join("");
  return layout({
    path: "/academy/",
    title: "Academy",
    description: "Beauty and aesthetics courses at the Beauty Heaven Academy in Hoddesdon, Hertfordshire. Online pre-study, then hands-on training.",
    body: `<section class="hero" style="padding-bottom:40px"><div class="wrap">
      <p class="micro" style="color:var(--bh-ivory)">Beauty Heaven Academy</p>
      <h1>Learn the craft, <b>properly</b>.</h1>
      <p>Hands-on training in beauty and aesthetics, in a working salon. Ask us about dates, and we'll help you choose the right course.</p>
      <div class="btns">${askButton("Hi Beauty Heaven Academy, I'd like to know more about your courses", "Ask about courses", "btn--gold")}</div>
    </div></section>

    <section class="sec"><div class="wrap">
      <h2>Courses</h2>
      <p class="lead">${tbc("which courses are running now, and their dates", "/academy/")}</p>
      <div class="grid grid--3" style="margin-top:20px">${list}</div>
      <p class="card__meta">${tbc("entry requirements for each course, and who can enrol", "/academy/")}</p>
    </div></section>

    <section class="sec sec--alt"><div class="wrap">
      <h2>How it <b>works</b></h2>
      <ol class="steps">
        <li><h3>Ask</h3><p>Tell us which course you're interested in. We'll talk you through dates and anything you need before you start.</p></li>
        <li><h3>Secure your place</h3><p>A 50% deposit holds your place, and we'll confirm by email.</p></li>
        <li><h3>Study, then train</h3><p>You'll get a login for the online pre-study, which needs to be finished before your classroom day. It works on a computer or tablet, not a phone.</p></li>
      </ol>
      <p class="card__meta">What you receive when you finish: ${tbc("what the certificate says and who issues it", "/academy/")}</p>
      <div class="btns"><a class="btn btn--line" href="/policies/#academy">Academy booking terms</a></div>
    </div></section>`,
  });
}

function consultations() {
  const consultRows = services
    .filter((s) => s.Type === "Consultation" || /consult/i.test(s.Service))
    .filter((s) => !/student practical/.test(s.Flags))
    .map((s) => `<li><span class="n">${esc(tidy(s.Service))}</span><span class="d">${esc(s.Category)}${s["Online?"] === "Y" ? " · book online" : " · by phone or message"}</span><span class="p">${Number(s["Price £"]) > 0 ? money(s["Price £"]) : "Free"}</span></li>`)
    .join("");
  return layout({
    path: "/consultations/",
    title: "Consultations",
    description: "Which treatments at Beauty Heaven Hub start with a consultation, what they cost and how to book one.",
    body: `<section class="sec"><div class="narrow">
      <p class="micro">Before your treatment</p>
      <h1>Consultations</h1>
      <p class="lead">For aesthetic treatments, semi-permanent make-up and some skin treatments, we start with a consultation. It's a chance to talk through what you'd like, check the treatment is right for you, and answer your questions, with no pressure to go ahead.</p>
      <ul class="items" style="margin-top:20px">${consultRows}</ul>
      <p class="card__meta">${tbc("whether consultation fees come off the treatment price", "/consultations/")}</p>
      <div class="btns">${askButton("Hi Beauty Heaven, I'd like to book a consultation", "Book a consultation", "btn--gold")}<a class="btn btn--line" href="${site.booking.home}">Book online</a></div>
      <h2 style="margin-top:40px">Patch tests</h2>
      <p>Lashes, laser and semi-permanent make-up need a patch test before your first treatment. We'll arrange it when you book.</p>
    </div></section>`,
  });
}

function visit() {
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Beauty Heaven Hub, " + site.address.join(", "))}`;
  const hours = site.hours.length
    ? `<dl class="facts">${site.hours.map(([d, h]) => `<div><dt>${esc(d)}</dt><dd>${esc(h)}</dd></div>`).join("")}</dl>`
    : `<p>${tbc("opening hours", "/visit/")}</p>`;
  return layout({
    path: "/visit/",
    title: "Visit us",
    description: `Find Beauty Heaven Hub at ${site.address.join(", ")}. Opening hours, phone and directions.`,
    body: `<section class="sec"><div class="wrap grid grid--2">
      <div>
        <p class="micro">Visit us</p>
        <h1>Find <b>us</b></h1>
        <dl class="facts">
          <div><dt>Address</dt><dd>${site.address.map(esc).join("<br>")}${site.addressConfirmed ? "" : "<br>" + tbc("address", "/visit/")}</dd></div>
          <div><dt>Phone</dt><dd><a href="tel:${site.phoneHref}">${esc(site.phone)}</a></dd></div>
          <div><dt>WhatsApp</dt><dd>${site.whatsapp ? `<a href="${waLink("Hi Beauty Heaven")}">Message us</a>` : tbc("WhatsApp number (new number for the assistant)", "/visit/")}</dd></div>
          <div><dt>Email</dt><dd>${site.email && site.email !== "TBC" ? `<a href="mailto:${esc(site.email)}">${esc(site.email)}</a>` : tbc("main business email", "/visit/")}</dd></div>
        </dl>
        <div class="btns"><a class="btn btn--dark" href="${maps}">Open in Google Maps</a></div>
        <h2 style="margin-top:36px;font-size:1.5rem">Opening hours</h2>
        ${hours}
        <p class="card__meta">${tbc("parking and getting here", "/visit/")}</p>
      </div>
      <div class="bh-arch" style="max-width:460px;justify-self:center">${photo("salon-mirrors", "The salon at Beauty Heaven Hub")}</div>
    </div></section>`,
  });
}

function policies() {
  return layout({
    path: "/policies/",
    title: "Booking policies",
    description: "Deposits, cancellations and booking terms for treatments and Academy courses at Beauty Heaven Hub.",
    body: `<section class="sec"><div class="narrow">
      <p class="micro">The small print</p>
      <h1>Booking <b>policies</b></h1>
      <h2 style="font-size:1.5rem">Treatments</h2>
      <p>${tbc("deposit, cancellation, late arrival and no-show rules for treatments", "/policies/")}</p>
      <p>Some treatments have age limits and need a consultation or patch test first. We'll tell you when you book.</p>
      <h2 style="font-size:1.5rem" id="academy">Academy courses</h2>
      <ul>
        <li>A 50% deposit secures your place. We confirm by email.</li>
        <li>Classroom courses can be rescheduled up to 48 hours before the course date.</li>
        <li>To cancel a classroom course, tell us at least 15 working days before. A 30% admin fee applies. Cancellations made later than that are not refunded.</li>
        <li>Online distance courses have a 14-day cancellation right, refunded less a 25% admin fee, and no refund once your login details have been issued.</li>
      </ul>
      <p class="card__meta">${tbc("these Academy terms are taken from the current website; check they are still current", "/policies/")}</p>
      <h2 style="font-size:1.5rem">Paying</h2>
      <p>${tbc("payment options to show (card, Klarna, finance, gift vouchers)", "/policies/")}</p>
    </div></section>`,
  });
}

function privacy() {
  return layout({
    path: "/privacy/",
    title: "Privacy",
    description: "How Beauty Heaven Hub uses your personal information.",
    body: `<section class="sec"><div class="narrow">
      <h1>Privacy</h1>
      <p>${tbc("full privacy notice, to be written with the data agreement and checked before launch", "/privacy/")}</p>
      <p>${esc(site.company)} is responsible for the personal information you give us when you book, message or call.</p>
      <p>This website does not use advertising cookies. Bookings are handled by our booking system, Phorest, under its own privacy policy.</p>
    </div></section>`,
    bookbar: false,
  });
}

function notFound() {
  return layout({
    path: "/404",
    title: "Page not found",
    description: "That page isn't here.",
    body: `<section class="sec"><div class="narrow"><h1>That page isn't <b>here</b></h1><p>It may have moved when we rebuilt the website.</p><div class="btns"><a class="btn btn--dark" href="/treatments/">See treatments</a><a class="btn btn--line" href="/">Home</a></div></div></section>`,
  });
}

// ----------------------------------------------------------------- build --
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

// Brand assets, copied from the brand kit so there is one master copy.
cpSync(join(BRAND, "brand.css"), join(OUT, "brand.css"));
cpSync(join(HERE, "src/site.css"), join(OUT, "site.css"));
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
if (existsSync(join(BRAND, "og.jpg"))) cpSync(join(BRAND, "og.jpg"), join(OUT, "og.jpg"));

write("/", home());
write("/treatments/", treatmentsIndex());
for (const g of groups) write(`/treatments/${g.slug}/`, groupPage(g));
write("/academy/", academy());
write("/consultations/", consultations());
write("/visit/", visit());
write("/policies/", policies());
write("/privacy/", privacy());
writeFileSync(join(OUT, "404.html"), notFound());

const pages = ["/", "/treatments/", ...groups.map((g) => `/treatments/${g.slug}/`), "/academy/", "/consultations/", "/visit/", "/policies/", "/privacy/"];
writeFileSync(join(OUT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((p) => `  <url><loc>${site.url}${p}</loc></url>`).join("\n")}\n</urlset>\n`);
writeFileSync(join(OUT, "robots.txt"), site.launched ? `User-agent: *\nAllow: /\nSitemap: ${site.url}/sitemap.xml\n` : "User-agent: *\nDisallow: /\n");

// The list of everything still to confirm, regenerated on every build.
const lines = [...todo].sort();
writeFileSync(join(HERE, "CONTENT-TODO.md"), `# Beauty Heaven Hub website: still to confirm\n\nGenerated by build.mjs. Each line shows as a yellow note on the draft site. Fix it in data/site.json, data/groups.json or build.mjs, then rebuild.\n\n${lines.map((l) => `- ${l}`).join("\n")}\n`);

const listed = groups.reduce((n, g) => n + g.count, 0);
console.log(`Built ${pages.length} pages. ${listed} treatments listed, ${courses.length} courses. ${lines.length} items still to confirm.`);
