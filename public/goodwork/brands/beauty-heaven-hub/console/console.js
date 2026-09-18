/* ============================================================================
   The Content Console.

   Six views over one store. Everything the console knows is in store.js and
   everything it writes goes through /api/console, which holds the key.

   The one piece of real engineering in here is the campaign: six requests fired
   together, each streaming into its own panel. It is done that way because a
   screen that fills in is a screen that is obviously working, because the brand
   prompt is identical across the six and gets cached after the first, and
   because one long response that dies at eighty per cent loses everything.
   ========================================================================== */

import * as store from "./store.js";

const API = "/api/console";
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.prototype.slice.call(r.querySelectorAll(s));

const CHANNELS = {
  instagram: "Instagram carousel",
  blog: "Blog post",
  email: "Email",
  whatsapp: "WhatsApp reply",
  website: "Website answer",
  reel: "Reel script",
};
const STATES = { draft: "Draft", writing: "Writing…", waiting: "Waiting on you", approved: "Approved" };

/* ------------------------------------------------------------------ CHROME -- */
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("on");
  clearTimeout(toast.t);
  toast.t = setTimeout(() => t.classList.remove("on"), 2600);
}

function show(name) {
  $$(".view").forEach((v) => v.classList.toggle("on", v.dataset.view === name));
  $$(".rail__nav button").forEach((b) => b.classList.toggle("on", b.dataset.view === name));
  location.hash = name;
  const render = VIEWS[name];
  if (render) render();
  $("#main").scrollTo({ top: 0 });
}

$$(".rail__nav button, [data-go]").forEach((b) =>
  b.addEventListener("click", () => show(b.dataset.view || b.dataset.go)),
);
$(".rail__foot .link").addEventListener("click", () => show("about"));

function tag(state) {
  return `<span class="tag tag--${state}">${STATES[state] || state}</span>`;
}
function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
}

/* ================================================================ DASHBOARD == */
function renderDashboard() {
  const s = store.load();
  const c = store.counts();
  const h = new Date().getHours();

  $("#dashGreeting").textContent =
    h < 12 ? "Morning." : h < 18 ? "Afternoon." : "Evening.";

  $("#dashStats").innerHTML = [
    stat(c.waiting, c.waiting === 1 ? "piece waiting on you" : "pieces waiting on you", c.waiting > 0),
    stat(c.approved, "approved and ready"),
    stat(c.campaigns, c.campaigns === 1 ? "idea written up" : "ideas written up"),
    stat(s.ideas.length, "ideas captured"),
  ].join("");

  $("#ideaList").innerHTML =
    s.ideas.length === 0
      ? `<li class="empty">Nothing captured yet. The next question someone asks at the desk goes here.</li>`
      : s.ideas
          .map(
            (i) => `<li class="idea${i.used ? " idea--used" : ""}" data-id="${i.id}">
              <p>${esc(i.text)}</p>
              <small>${esc(i.source)}</small>
              <button class="btn btn--tiny" data-use="${i.id}">${i.used ? "Again" : "Write it"}</button>
              <button class="x" data-del="${i.id}" aria-label="Remove idea">×</button>
            </li>`,
          )
          .join("");

  $("#workList").innerHTML =
    s.campaigns.length === 0
      ? `<li class="empty">Nothing written yet.</li>`
      : s.campaigns
          .slice(0, 8)
          .map((cp) => {
            const states = Object.values(cp.pieces);
            return `<li class="work" data-open="${cp.id}">
              <b>${esc(cp.brief.slice(0, 74))}${cp.brief.length > 74 ? "…" : ""}</b>
              <small>${states.length} ${states.length === 1 ? "piece" : "pieces"} · ${when(cp.createdAt)}</small>
              <span class="states">${states
                .map((p) => `<span class="dot dot--${p.state}" title="${STATES[p.state]}"></span>`)
                .join("")}</span>
            </li>`;
          })
          .join("");

  const pill = $("#waitingPill");
  pill.hidden = c.waiting === 0;
  pill.textContent = c.waiting;
}

function stat(n, label, hot) {
  return `<div class="stat${hot ? " stat--wait" : ""}"><b>${n}</b><span>${label}</span></div>`;
}
function when(iso) {
  const d = (Date.now() - new Date(iso)) / 86400000;
  if (d < 1) return "today";
  if (d < 2) return "yesterday";
  return `${Math.floor(d)} days ago`;
}

$("#addIdea").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = e.target.elements.text;
  if (!input.value.trim()) return;
  store.addIdea(input.value);
  input.value = "";
  renderDashboard();
});

$("#ideaList").addEventListener("click", (e) => {
  const del = e.target.closest("[data-del]");
  if (del) { store.removeIdea(del.dataset.del); renderDashboard(); return; }
  const use = e.target.closest("[data-use]");
  if (use) {
    const idea = store.load().ideas.find((i) => i.id === use.dataset.use);
    if (!idea) return;
    show("campaign");
    $("#briefForm").elements.brief.value = idea.text;
    $("#briefForm").elements.brief.focus();
  }
});

$("#workList").addEventListener("click", (e) => {
  const open = e.target.closest("[data-open]");
  if (open) openCampaign(open.dataset.open);
});

/* ================================================================= CAMPAIGN == */
let current = null;   // the campaign on screen

$("#briefForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = e.target;
  const brief = f.elements.brief.value.trim();
  const context = f.elements.context.value.trim();
  const channels = $$("input[name=channel]:checked", f).map((i) => i.value);
  if (!brief || channels.length === 0) return;

  current = {
    id: store.uid(),
    brief,
    context,
    createdAt: new Date().toISOString(),
    pieces: Object.fromEntries(
      channels.map((ch) => [ch, { text: "", state: "writing", movedAt: null }]),
    ),
  };
  store.saveCampaign(current);
  store.markIdeaUsed(brief);
  renderPieces();
  writeAll(channels);
});

function openCampaign(id) {
  current = store.getCampaign(id);
  if (!current) return;
  show("campaign");
  $("#briefForm").elements.brief.value = current.brief;
  $("#briefForm").elements.context.value = current.context || "";
  $$("input[name=channel]").forEach((i) => { i.checked = !!current.pieces[i.value]; });
  renderPieces();
}

function renderPieces() {
  const host = $("#pieces");
  if (!current) { host.innerHTML = ""; return; }
  host.innerHTML = Object.entries(current.pieces)
    .map(
      ([ch, p]) => `
      <article class="piece piece--${p.state} ${p.state === "writing" ? "is-writing" : ""}" data-ch="${ch}">
        <div class="piece__top">
          <h3>${CHANNELS[ch]}</h3>
          ${tag(p.state)}
        </div>
        <div class="piece__body"><textarea spellcheck="true" aria-label="${CHANNELS[ch]}">${esc(p.text)}</textarea></div>
        <div class="piece__foot">
          <button class="btn btn--tiny" data-copy="${ch}">Copy</button>
          <button class="btn btn--tiny" data-again="${ch}">Write it again</button>
          <span class="spacer"></span>
          ${p.state === "approved"
            ? `<button class="btn btn--tiny" data-unapprove="${ch}">Unapprove</button>`
            : `<button class="btn btn--tiny btn--gold" data-approve="${ch}">Approve</button>`}
        </div>
      </article>`,
    )
    .join("");
}

$("#pieces").addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn || !current) return;
  const { copy, again, approve, unapprove } = btn.dataset;
  if (copy) {
    navigator.clipboard.writeText(current.pieces[copy].text).then(() => toast("Copied."));
  } else if (again) {
    current.pieces[again] = { text: "", state: "writing", movedAt: null };
    store.saveCampaign(current);
    renderPieces();
    writeAll([again]);
  } else if (approve) {
    store.setPieceState(current.id, approve, "approved");
    current = store.getCampaign(current.id);
    renderPieces();
  } else if (unapprove) {
    store.setPieceState(current.id, unapprove, "waiting");
    current = store.getCampaign(current.id);
    renderPieces();
  }
});

/* An edit is the person taking it over, so it stops being a model's draft. */
$("#pieces").addEventListener("input", (e) => {
  const ta = e.target.closest("textarea");
  if (!ta || !current) return;
  const ch = ta.closest("[data-ch]").dataset.ch;
  clearTimeout(ta._t);
  ta._t = setTimeout(() => {
    store.setPieceText(current.id, ch, ta.value);
    current = store.getCampaign(current.id);
  }, 400);
});

/* ------------------------------------------------------------ the streaming --
   All channels at once. Each one owns its panel and nothing waits for anything
   else, so the first words land in about a second rather than after the longest
   piece has finished. */
function writeAll(channels) {
  const btn = $("#writeBtn");
  btn.disabled = true;
  btn.textContent = "Writing…";
  $("#writeNote").textContent = "Each one arrives on its own. Nothing is sent anywhere.";

  Promise.allSettled(channels.map(writeOne)).then(() => {
    btn.disabled = false;
    btn.textContent = "Write it";
    store.saveCampaign(current);
    renderDashboard();
    const n = Object.values(current.pieces).filter((p) => p.state === "waiting").length;
    $("#writeNote").textContent = `${n} ${n === 1 ? "piece" : "pieces"} waiting on you.`;
  });
}

async function writeOne(channel) {
  const panel = () => $(`#pieces [data-ch="${channel}"]`);
  const area = () => panel()?.querySelector("textarea");

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        channel,
        brief: current.brief,
        context: current.context,
        brand: store.load().brand,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        err.error === "not_configured"
          ? "This deployment has no API key set, so nothing can be written yet."
          : err.message || `The endpoint returned ${res.status}.`,
      );
    }

    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let text = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      text += dec.decode(value, { stream: true });
      current.pieces[channel].text = text;
      const ta = area();
      if (ta) { ta.value = text; ta.scrollTop = ta.scrollHeight; }
    }

    current.pieces[channel].text = text.trim();
    current.pieces[channel].state = "waiting";
  } catch (err) {
    current.pieces[channel].text = `[${err.message}]`;
    current.pieces[channel].state = "draft";
  } finally {
    store.saveCampaign(current);
    renderPieces();
  }
}

/* ================================================================ APPROVALS == */
function renderApprovals() {
  const items = store.waiting();
  $("#queue").innerHTML =
    items.length === 0
      ? `<p class="empty">Nothing waiting. Everything written has been read.</p>`
      : items
          .map(
            ({ campaign, channel, piece }) => `
        <article class="qitem" data-c="${campaign.id}" data-ch="${channel}">
          <header>
            <b>${CHANNELS[channel]}</b>${tag(piece.state)}
            <span class="spacer" style="flex:1"></span>
            <small class="note">${esc(campaign.brief.slice(0, 60))}${campaign.brief.length > 60 ? "…" : ""}</small>
          </header>
          <pre class="${piece.text.length > 420 ? "long" : ""}">${esc(piece.text)}</pre>
          <div class="row">
            <button class="btn btn--tiny btn--gold" data-ok>Approve</button>
            <button class="btn btn--tiny" data-edit>Open and edit</button>
          </div>
        </article>`,
          )
          .join("");
}

$("#queue").addEventListener("click", (e) => {
  const item = e.target.closest(".qitem");
  if (!item) return;
  if (e.target.closest("[data-ok]")) {
    store.setPieceState(item.dataset.c, item.dataset.ch, "approved");
    renderApprovals();
    renderDashboard();
    toast("Approved.");
  } else if (e.target.closest("[data-edit]")) {
    openCampaign(item.dataset.c);
  }
});

/* ================================================================= CALENDAR == */
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function approvedPieces() {
  return store
    .load()
    .campaigns.flatMap((c) =>
      Object.entries(c.pieces)
        .filter(([, p]) => p.state === "approved")
        .map(([ch, p]) => ({ c, ch, p })),
    );
}

function renderCalendar() {
  const approved = approvedPieces();

  $("#week").innerHTML = DAYS.map((d) => {
    const seeded = store.load().calendar.filter((s) => s.day === d);
    const placed = approved.filter((a) => a.p.day === d);
    const slots = [
      ...seeded.map(
        (s) => `<div class="slot ${s.state !== "scheduled" ? "slot--draft" : ""}">${esc(s.what)}</div>`,
      ),
      ...placed.map(
        (a) => `<div class="slot" data-c="${a.c.id}" data-ch="${a.ch}">${CHANNELS[a.ch]}
          <br><small class="note">${esc(a.c.brief.slice(0, 38))}</small>
          <button class="x" data-unplace aria-label="Take off the calendar">×</button></div>`,
      ),
    ];
    return `<div class="day"><b>${d}</b>${slots.join("") || '<p class="note">—</p>'}</div>`;
  }).join("");

  /* Approved but not placed. This tray is the honest half of a calendar: work
     that is ready and has not been given a day yet, rather than work the
     software quietly spread across the week to look busy. */
  const loose = approved.filter((a) => !a.p.day);
  $("#tray").innerHTML =
    loose.length === 0
      ? `<p class="note">Everything approved has a day. Anything you approve next turns up here to be placed.</p>`
      : loose
          .map(
            (a) => `<div class="tray__item" data-c="${a.c.id}" data-ch="${a.ch}">
              <b>${CHANNELS[a.ch]}</b>
              <small class="note">${esc(a.c.brief.slice(0, 46))}</small>
              <select aria-label="Put ${CHANNELS[a.ch]} on a day">
                <option value="">Put it on…</option>
                ${DAYS.map((d) => `<option value="${d}">${d}</option>`).join("")}
              </select>
            </div>`,
          )
          .join("");
}

$("#tray").addEventListener("change", (e) => {
  const item = e.target.closest(".tray__item");
  if (!item || !e.target.value) return;
  store.setPieceDay(item.dataset.c, item.dataset.ch, e.target.value);
  renderCalendar();
  toast(`Placed on ${e.target.value}.`);
});

$("#week").addEventListener("click", (e) => {
  const slot = e.target.closest("[data-unplace]")?.closest(".slot");
  if (!slot) return;
  store.setPieceDay(slot.dataset.c, slot.dataset.ch, null);
  renderCalendar();
});

/* ==================================================================== EMAIL == */
/* The email tab renders the brand's real templates — the same four files that
   go to the CRM — rather than a lookalike built in here. Each template marks
   its editable regions with `<!-- bh:slot name -->` and this fills them, which
   keeps the template the single source of truth for the design and leaves the
   console as only the thing that types into it. Change a colour in
   ../email/welcome.html and this screen changes with it. */

const TEMPLATES = {
  arch: {
    name: "Arch",
    file: "../email/welcome.html",
    note: "The one that is live. Taupe masthead, arch hero, both worlds as picture cards.",
  },
  maison: {
    name: "Maison",
    file: "../email/welcome-maison.html",
    note: "Centred and printed, on the paper rather than in a band. The button is outlined, so it asks rather than shouts.",
  },
  noir: {
    name: "Noir",
    file: "../email/welcome-noir.html",
    note: "Espresso throughout — evening, launches, the Academy. The only one that needs no defending against a client's dark mode.",
  },
  lettre: {
    name: "Lettre",
    file: "../email/welcome-lettre.html",
    note: "A signed letter, no photography, and the only one that invites a reply. Sign it before it sends: it ships with [Name] and [Role] as gaps.",
  },
};

/* What the CRM merges in at send time. It fills the preview so the wording can
   be read the way a customer reads it, and never touches the copied HTML,
   which keeps the tags intact. The address, phone and email are placeholders —
   the real ones come from the CRM's location record. */
const SAMPLE = {
  "{{contact.first_name}}": "Sophie",
  "{{custom_values.booking_url}}": "#",
  "{{location.full_address}}": "1 Example Street, Wombwell, Barnsley S73 0AA",
  "{{location.phone}}": "01226 000000",
  "{{location.email}}": "hello@beautyheavenhub.co.uk",
  "{{unsubscribe_link}}": "#",
  "[Name]": "Jess",
  "[Role]": "Owner",
};

const SLOT = /<!-- bh:slot (\w+) -->([\s\S]*?)<!-- bh:endslot -->/g;
const templates = new Map();

async function templateHtml(id) {
  if (!templates.has(id)) {
    const res = await fetch(TEMPLATES[id].file, { cache: "no-cache" });
    if (!res.ok) throw new Error(`${res.status} on ${TEMPLATES[id].file}`);
    templates.set(id, await res.text());
  }
  return templates.get(id);
}

/* One paragraph per blank line, wearing the opening tag the template already
   uses — so the copy arrives in the template's own type rather than in this
   file's idea of it, and the last paragraph keeps the wider gap that sits
   above the button. */
function paragraphs(slot, text) {
  const opens = slot.match(/<p\b[^>]*>/g) || [];
  const parts = text.split(/\n{2,}/).map((t) => t.trim()).filter(Boolean);
  if (!parts.length || !opens.length) return slot;
  const first = opens[0];
  const last = opens[opens.length - 1];
  return parts
    .map((t, i) => `${i === parts.length - 1 ? last : first}${esc(t).replace(/\n/g, "<br>")}</p>`)
    .join("\n\n        ");
}

/* Every headline in the brand is light with one word bold. *asterisks* mark
   that word, and it is set in whatever bold the template itself uses. */
function headline(slot, text) {
  const bold = (slot.match(/<b\b[^>]*>/) || ['<b style="font-weight:700;">'])[0];
  return esc(text)
    .replace(/\*([^*]+)\*/g, (m, word) => `${bold}${word}</b>`)
    .replace(/\n/g, "<br>");
}

function fill(html, fields) {
  return html.replace(SLOT, (whole, name, inner) => {
    let out = inner;
    if (name === "preheader" && fields.preheader) out = esc(fields.preheader);
    if (name === "headline" && fields.headline) out = headline(inner, fields.headline);
    if (name === "body" && fields.body) out = paragraphs(inner, fields.body);
    return `<!-- bh:slot ${name} -->${out}<!-- bh:endslot -->`;
  });
}

function withSample(html) {
  return Object.keys(SAMPLE).reduce((out, tag) => out.split(tag).join(SAMPLE[tag]), html);
}

/* An email has to carry absolute URLs, so the templates point their images and
   fonts at the live domain. That is right for the send and wrong for the
   preview: on a branch deployment it would show production's artwork rather
   than the artwork sitting next to it, and any image added on the branch would
   simply 404. So the preview — and only the preview — reads them from wherever
   this console is being served. The copied HTML keeps the live URLs. */
const LIVE_BRAND = "https://goodworkagency.uk/goodwork/brands/beauty-heaven-hub/";

function fromHere(html) {
  const here = new URL("../", location.href).href;
  return here === LIVE_BRAND ? html : html.split(LIVE_BRAND).join(here);
}

/* If the template files cannot be fetched — the console opened from a file://
   path, or the brand folder moved — the tab still works, on a plain shell that
   says so rather than a blank screen. */
const FALLBACK_SHELL = (pre, body) => `<!doctype html><html><head><meta charset="utf-8">
<style>
  body{margin:0;background:#ECE6DD;font-family:'Century Gothic',Futura,Helvetica,Arial,sans-serif;}
  .w{max-width:600px;margin:0 auto;background:#F4F0E9;}
  .hd{background:#746B60;padding:26px 30px;text-align:center;}
  .hd b{color:#C9A65C;font-size:19px;font-weight:400;letter-spacing:.02em;}
  .bd{padding:30px;color:#24211E;font-size:15px;line-height:1.65;}
  .bd p{margin:0 0 14px;}
  .cta{display:inline-block;background:#C9A65C;color:#24211E;text-decoration:none;
       padding:13px 28px;border-radius:999px;font-size:14px;margin-top:6px;}
  .ft{background:#24211E;color:#B9AFA2;padding:22px 30px;font-size:11px;line-height:1.7;}
  .pre{display:none;font-size:1px;color:#F4F0E9;}
</style></head><body>
<div class="pre">${esc(pre)}</div>
<div class="w">
  <div class="hd"><b>beauty <strong>heaven</strong> hub</b></div>
  <div class="bd">
    ${body.split(/\n{2,}/).filter(Boolean).map((t) => `<p>${esc(t).replace(/\n/g, "<br>")}</p>`).join("\n    ")}
    <a class="cta" href="{{custom_values.booking_url}}">Book a treatment</a>
  </div>
  <div class="ft">Beauty Heaven Hub<br>{{location.full_address}}<br>
    {{location.phone}} · {{location.email}}<br><br>
    <a href="{{unsubscribe_link}}" style="color:#B9AFA2;">Unsubscribe</a>
  </div>
</div></body></html>`;

let emailHtml = "";      // the copyable version: real merge tags, no sample data
let emailSample = true;

async function renderEmail() {
  const id = store.load().email.template;
  const fields = {
    preheader: $("#emPre").value.trim(),
    headline: $("#emHead").value.trim(),
    body: $("#emBody").value.trim(),
  };

  try {
    emailHtml = fill(await templateHtml(id), fields);
    $("#emNote").textContent = "The merge tags stay intact, so it can go straight into the CRM.";
  } catch (err) {
    emailHtml = FALLBACK_SHELL(fields.preheader, fields.body || "The body of the email goes here.");
    $("#emNote").textContent = `Couldn't load ${TEMPLATES[id].file} (${err.message}) — showing a plain shell instead.`;
  }

  $("#emTplNote").textContent = TEMPLATES[id].note;
  $("#emFrame").srcdoc = fromHere(emailSample ? withSample(emailHtml) : emailHtml);
  return emailHtml;
}

/* A keystroke should not reload the iframe. */
let emailTimer;
function renderEmailSoon() {
  clearTimeout(emailTimer);
  emailTimer = setTimeout(renderEmail, 180);
}

["#emPre", "#emHead", "#emBody"].forEach((sel) => $(sel).addEventListener("input", renderEmailSoon));

/* One picker, scoped to its own group — there are three of them on this screen. */
function seg(id, pick) {
  const group = $(id);
  $$("button", group).forEach((b) =>
    b.addEventListener("click", () => {
      $$("button", group).forEach((x) => x.classList.toggle("on", x === b));
      pick(b);
    }),
  );
}

seg("#emTemplate", (b) => {
  store.setEmailTemplate(b.dataset.t);
  renderEmail();
});
seg("#emData", (b) => {
  emailSample = b.dataset.d === "sample";
  renderEmail();
});
seg("#emWidth", (b) => {
  $("#emPreview").dataset.w = b.dataset.w;
});

/* Opening the tab: the picker catches up with whichever template was last
   chosen, then the preview draws. */
function renderEmailView() {
  const id = store.load().email.template;
  $$("button", $("#emTemplate")).forEach((b) => b.classList.toggle("on", b.dataset.t === id));
  renderEmail();
}

$("#emFromPiece").addEventListener("click", () => {
  const found = store
    .load()
    .campaigns.flatMap((c) => Object.entries(c.pieces).map(([ch, p]) => ({ ch, p })))
    .find(({ ch, p }) => ch === "email" && p.text);
  if (!found) return toast("No email written yet.");
  // The endpoint returns subject, preheader and body as lines; split them back out.
  const lines = found.p.text.split("\n").filter((l) => l.trim());
  const sub = lines.find((l) => /^subject/i.test(l)) || lines[0] || "";
  const pre = lines.find((l) => /^preheader/i.test(l)) || "";
  $("#emSubject").value = sub.replace(/^subject( line)?:?\s*/i, "").trim();
  $("#emPre").value = pre.replace(/^preheader:?\s*/i, "").trim();
  $("#emBody").value = lines
    .filter((l) => l !== sub && l !== pre && !/^(subject|preheader)/i.test(l))
    .join("\n\n")
    .trim();
  renderEmail();
  toast("Pulled in.");
});

$("#emCopy").addEventListener("click", () => {
  renderEmail().then((html) =>
    navigator.clipboard
      .writeText(html)
      .then(() => toast(`${TEMPLATES[store.load().email.template].name} copied — merge tags intact.`))
      .catch(() => toast("Couldn't reach the clipboard.")),
  );
});

/* ==================================================================== BRAND == */
const LISTS = ["treatments", "team", "never"];

function renderBrand() {
  const b = store.load().brand;
  const f = $("#brandForm");
  Object.keys(b).forEach((k) => {
    if (!f.elements[k]) return;
    f.elements[k].value = LISTS.includes(k) ? (b[k] || []).join("\n") : b[k] || "";
  });
  $("#brandSaved").textContent = store.load().savedAt
    ? `Saved ${when(store.load().savedAt)}`
    : "";
}

$("#brandForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = e.target;
  const patch = {};
  Object.keys(store.load().brand).forEach((k) => {
    if (!f.elements[k]) return;
    const v = f.elements[k].value;
    patch[k] = LISTS.includes(k) ? v.split("\n").map((s) => s.trim()).filter(Boolean) : v.trim();
  });
  store.setBrand(patch);
  $("#brandSaved").textContent = "Saved. The next thing written uses it.";
  toast("Brand saved.");
});

/* ==================================================================== ABOUT == */
function renderAbout() {
  let size = "—";
  try {
    size = `${Math.round((localStorage.getItem("bhh.console.v1") || "").length / 1024)} kB`;
  } catch { /* storage blocked */ }
  const c = store.counts();
  $("#storeNote").textContent =
    `Right now: ${c.campaigns} ideas written up, ${c.pieces} pieces, ${size} in this browser.`;
}

$("#expBtn").addEventListener("click", () => {
  const blob = new Blob([store.exportAll()], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `beauty-heaven-console-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
});

$("#impBtn").addEventListener("click", () => $("#impFile").click());
$("#impFile").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    store.importAll(await file.text());
    renderAll();
    toast("Loaded.");
  } catch (err) {
    toast(err.message);
  }
  e.target.value = "";
});

/* ===================================================================== BOOT == */
const VIEWS = {
  dashboard: renderDashboard,
  campaign: renderPieces,
  approvals: renderApprovals,
  calendar: renderCalendar,
  email: renderEmailView,
  brand: renderBrand,
  about: renderAbout,
};

function renderAll() {
  Object.values(VIEWS).forEach((fn) => fn());
}

store.load();
renderAll();
show(VIEWS[location.hash.slice(1)] ? location.hash.slice(1) : "dashboard");
