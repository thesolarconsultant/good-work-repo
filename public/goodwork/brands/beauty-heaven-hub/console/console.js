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
import { makeSet, toBlob } from "./cards.js";

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
  const style = f.elements.style?.value || "answer";
  if (!brief || channels.length === 0) return;

  current = {
    id: store.uid(),
    brief,
    context,
    style,
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
  /* Campaigns written before styles existed have none; they reopen as the
     straight answer, which is what they were. */
  $$("input[name=style]").forEach((i) => { i.checked = i.value === (current.style || "answer"); });
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
          ${ch === "instagram" && p.text.trim()
            ? `<button class="btn btn--tiny" data-slides="${ch}">Make the slides</button>`
            : ""}
          ${p.text.trim() ? `<button class="btn btn--tiny" data-shot="${ch}">Make a picture</button>` : ""}
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
  const { copy, again, approve, unapprove, slides, shot } = btn.dataset;
  if (shot) {
    openShot(current.pieces[shot].text);
  } else if (slides) {
    openSlides(current.pieces[slides].text);
  } else if (copy) {
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
        style: current.style,
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
            <span class="spacer" style="flex:1"></span>
            <button class="btn btn--tiny btn--bin" data-bin>Discard</button>
          </div>
        </article>`,
          )
          .join("");
}

$("#queue").addEventListener("click", (e) => {
  const item = e.target.closest(".qitem");
  if (!item) return;

  /* Discarding is the one thing here with no undo, so it asks once — in the
     button itself rather than in a dialog, which is quicker to confirm and
     quicker to change your mind about. It gives up after a few seconds so a
     half-pressed button never sits there armed. */
  const bin = e.target.closest("[data-bin]");
  if (bin) {
    if (bin.dataset.armed) {
      store.removePiece(item.dataset.c, item.dataset.ch);
      if (current && current.id === item.dataset.c) {
        current = store.getCampaign(item.dataset.c);
        renderPieces();
      }
      renderApprovals();
      renderDashboard();
      toast("Discarded.");
    } else {
      $$("[data-bin]").forEach((b) => {
        delete b.dataset.armed;
        b.textContent = "Discard";
        b.classList.remove("is-armed");
      });
      bin.dataset.armed = "1";
      bin.textContent = "Discard — sure?";
      bin.classList.add("is-armed");
      setTimeout(() => {
        if (!bin.dataset.armed) return;
        delete bin.dataset.armed;
        bin.textContent = "Discard";
        bin.classList.remove("is-armed");
      }, 4000);
    }
    return;
  }

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
const EMAIL_SHELL = (subject, pre, body) => `<!doctype html><html><head><meta charset="utf-8">
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
<div class="pre">${pre}</div>
<div class="w">
  <div class="hd"><b>beauty <strong>heaven</strong> hub</b></div>
  <div class="bd">
    ${body.split(/\n{2,}/).filter(Boolean).map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("\n    ")}
    <a class="cta" href="{{custom_values.booking_url}}">Book a treatment</a>
  </div>
  <div class="ft">Beauty Heaven Hub<br>{{location.full_address}}<br>
    {{location.phone}} · {{location.email}}<br><br>
    <a href="{{unsubscribe_link}}" style="color:#B9AFA2;">Unsubscribe</a>
  </div>
</div></body></html>`;

function renderEmail() {
  const html = EMAIL_SHELL(
    $("#emSubject").value || "Subject line",
    $("#emPre").value || "",
    $("#emBody").value || "The body of the email goes here.",
  );
  $("#emFrame").srcdoc = html;
  return html;
}
["#emSubject", "#emPre", "#emBody"].forEach((sel) => $(sel).addEventListener("input", renderEmail));

$$(".seg button").forEach((b) =>
  b.addEventListener("click", () => {
    $$(".seg button").forEach((x) => x.classList.toggle("on", x === b));
    $("#emPreview").dataset.w = b.dataset.w;
  }),
);

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
  navigator.clipboard.writeText(renderEmail()).then(() => toast("HTML copied — merge tags intact."));
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

/* ====================================================================== PDF == */
/* Work, as a document. The browser does the rendering — its "Save as PDF" keeps
   the real typeface, keeps the text selectable, and handles page breaks and
   widows, none of which a PDF library gives you for free.

   Two documents come out of the same builder, because they are the same object
   with a different filter on it: everything approved across every idea, or
   every piece written for the one idea on screen. */
function renderDoc(groups, title, note) {
  const total = groups.reduce((n, g) => n + g.pieces.length, 0);
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const head = `
    <header class="doc__head">
      <img src="../logo/beauty-heaven-hub-wordmark-espresso.svg" alt="Beauty Heaven Hub">
      <div>
        <b>${esc(title)}</b>
        <small>${today}</small>
      </div>
    </header>`;

  if (!total) {
    $("#doc").innerHTML = `${head}<p class="doc__empty">${esc(note)}</p>`;
    return 0;
  }

  $("#doc").innerHTML =
    head +
    groups
      .map(
        ({ c, pieces, meta }) => `
      <section class="doc__idea">
        <h2>${esc(c.brief)}</h2>
        <p class="doc__meta">${meta}</p>
        ${pieces
          .map(
            ([ch, p]) => `<div class="doc__piece">
              <h3>${CHANNELS[ch]}${p.day ? ` · ${p.day}` : ""}${
                p.state !== "approved" ? ` · ${STATES[p.state]}` : ""
              }</h3>
              <pre>${esc(p.text)}</pre>
            </div>`,
          )
          .join("")}
      </section>`,
      )
      .join("") +
    `<footer class="doc__foot">${total} ${total === 1 ? "piece" : "pieces"} across
      ${groups.length} ${groups.length === 1 ? "idea" : "ideas"}. Written in the Content Console.
      Anything not marked approved is still a draft.</footer>`;

  return total;
}

/* Everything signed off, across every idea. */
function buildApprovedDoc() {
  const groups = store
    .load()
    .campaigns.map((c) => {
      const pieces = Object.entries(c.pieces).filter(([, p]) => p.state === "approved");
      return { c, pieces, meta: `${pieces.length} approved · written ${when(c.createdAt)}` };
    })
    .filter((g) => g.pieces.length);

  return renderDoc(
    groups,
    "Approved content",
    "Nothing has been approved yet, so there is nothing to put on paper. Approve a piece and it will appear here.",
  );
}

/* One idea, every channel it was written for, whatever state each is in — the
   thing on screen, on paper, for reading away from the machine. */
/* The form a piece was written in is part of what it is, so it goes on the
   paper next to the count. Older campaigns have none and simply don't say. */
const STYLE_LABEL = {
  answer: "Straight answer",
  myth: "Myth, corrected",
  happens: "What actually happens",
  question: "A client asked us",
  behind: "Behind the work",
  aftercare: "How to look after it",
  news: "Something has changed",
  academy: "For the Academy",
};

function buildCampaignDoc(c) {
  const pieces = Object.entries(c.pieces).filter(([, p]) => p.text.trim());
  const approved = pieces.filter(([, p]) => p.state === "approved").length;
  const form = STYLE_LABEL[c.style] ? `${STYLE_LABEL[c.style]} · ` : "";
  return renderDoc(
    [{ c, pieces, meta: `${form}${pieces.length} ${pieces.length === 1 ? "piece" : "pieces"} · ${approved} approved · written ${when(c.createdAt)}` }],
    "One idea, everywhere",
    "Nothing written for this idea yet.",
  );
}

/* The print dialog freezes the page, so it waits for the logo — printing
   mid-render prints half a document. */
function toPaper() {
  const img = $("#doc img");
  const go = () => setTimeout(() => window.print(), 60);
  if (img && !img.complete) img.addEventListener("load", go, { once: true });
  else go();
}

$("#pdfBtn").addEventListener("click", () => {
  if (!buildApprovedDoc()) return toast("Nothing approved yet.");
  toPaper();
});

$("#pdfCampaign").addEventListener("click", () => {
  if (!current) return toast("Write something first.");
  if (!buildCampaignDoc(current)) return toast("Nothing written yet.");
  toPaper();
});

/* ===================================================================== BOOT == */
const VIEWS = {
  dashboard: renderDashboard,
  campaign: renderPieces,
  approvals: renderApprovals,
  calendar: renderCalendar,
  email: renderEmail,
  brand: renderBrand,
  about: renderAbout,
};

function renderAll() {
  Object.values(VIEWS).forEach((fn) => fn());
}

store.load();
renderAll();
show(VIEWS[location.hash.slice(1)] ? location.hash.slice(1) : "dashboard");


/* ------------------------------------------------------------- THE SLIDES --
   The carousel the console wrote, drawn as the carousel it was describing.
   Nothing generated, nothing paid for — the brand's own type on the brand's
   own ground, which is right every time and cannot come back uncanny.

   The overlay is built on demand rather than sitting in the markup: five
   1080×1350 canvases are real memory, and they should go when it closes. */
async function openSlides(text) {
  const wrap = document.createElement("div");
  wrap.className = "sheet";
  wrap.innerHTML = `
    <div class="sheet__box" role="dialog" aria-modal="true" aria-label="Carousel slides">
      <header class="sheet__top">
        <div>
          <p class="eyebrow">Ready to post</p>
          <h2 class="h3">The slides</h2>
        </div>
        <div class="row">
          <button class="btn btn--gold" id="slidesSave">Save all</button>
          <button class="btn btn--quiet" id="slidesClose">Close</button>
        </div>
      </header>
      <p class="note">1080 × 1350, the size the feed crops to. Click any one to save it on its own.</p>
      <div class="sheet__grid" id="slidesGrid"><p class="note">Drawing…</p></div>
    </div>`;
  document.body.appendChild(wrap);

  const close = () => wrap.remove();
  wrap.addEventListener("click", (e) => { if (e.target === wrap) close(); });
  $("#slidesClose", wrap).addEventListener("click", close);
  document.addEventListener("keydown", function esc(e) {
    if (e.key === "Escape") { close(); document.removeEventListener("keydown", esc); }
  });

  let canvases = [];
  try {
    canvases = await makeSet(text);
  } catch (err) {
    $("#slidesGrid", wrap).innerHTML = `<p class="note">${esc(err.message)}</p>`;
    return;
  }

  if (!canvases.length) {
    $("#slidesGrid", wrap).innerHTML =
      `<p class="note">No slides found in this one. The carousel needs its slide headings —
       write it again if they are missing.</p>`;
    return;
  }

  const grid = $("#slidesGrid", wrap);
  grid.innerHTML = "";
  canvases.forEach((c, i) => {
    c.className = "slide";
    c.title = `Slide ${i + 1} — click to save`;
    c.addEventListener("click", () => save(c, i));
    grid.appendChild(c);
  });

  async function save(canvas, i) {
    const blob = await toBlob(canvas);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `beauty-heaven-slide-${String(i + 1).padStart(2, "0")}.png`;
    a.click();
    /* Revoked on the next frame, not immediately: the click is queued and a
       revoked URL downloads an empty file. */
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  $("#slidesSave", wrap).addEventListener("click", async () => {
    /* One at a time, with a breath between: a browser that gets five download
       prompts in the same tick shows one and silently drops four. */
    for (let i = 0; i < canvases.length; i += 1) {
      await save(canvases[i], i);
      await new Promise((r) => setTimeout(r, 250));
    }
    toast(`${canvases.length} slides saved.`);
  });
}


/* ------------------------------------------------------------ THE PICTURE --
   Higgsfield, conditioned on a real photograph of the real salon. The looks
   live on the server, the same as the channels and the styles — this offers
   the choice between them and never a text box, because an open prompt is how
   you get generic AI salon stock, which is the one thing the guidelines are
   explicitly against.

   A job queue, so: submit, then poll. Tens of seconds, and the screen says so
   rather than spinning and hoping. */
const IMAGE_API = "/api/console-image";

async function openShot(text) {
  const wrap = document.createElement("div");
  wrap.className = "sheet";
  wrap.innerHTML = `
    <div class="sheet__box" role="dialog" aria-modal="true" aria-label="Make a picture">
      <header class="sheet__top">
        <div><p class="eyebrow">Shot on your own rooms</p><h2 class="h3">Make a picture</h2></div>
        <button class="btn btn--quiet" id="shotClose">Close</button>
      </header>
      <p class="note">Every look is conditioned on a real photograph of the salon, so the walls,
        fittings and light are yours rather than invented. Nothing here writes its own prompt.</p>
      <fieldset class="picks" id="shotLooks" style="margin-top:1rem"><legend>The look</legend></fieldset>
      <div class="row">
        <button class="btn btn--gold" id="shotGo">Make it</button>
        <span class="note" id="shotNote"></span>
      </div>
      <div class="sheet__grid" id="shotGrid"></div>
    </div>`;
  document.body.appendChild(wrap);

  const close = () => { wrap.remove(); clearTimeout(openShot.t); };
  wrap.addEventListener("click", (e) => { if (e.target === wrap) close(); });
  $("#shotClose", wrap).addEventListener("click", close);

  const note = (m) => { $("#shotNote", wrap).textContent = m; };

  /* Which looks exist is the server's business, so it is asked rather than
     assumed. It also answers whether there is a key at all, which is the far
     more common reason for nothing happening. */
  let health;
  try {
    health = await (await fetch(IMAGE_API)).json();
  } catch {
    note("Could not reach the picture endpoint.");
    return;
  }
  if (!health.configured) {
    $("#shotLooks", wrap).remove();
    $("#shotGo", wrap).disabled = true;
    note("This deployment has no Higgsfield key set, so it cannot make pictures yet.");
    return;
  }

  const suggested = health.styleLook?.[current?.style || "answer"] || "treatment";
  $("#shotLooks", wrap).insertAdjacentHTML("beforeend",
    Object.entries(health.looks).map(([k, label]) =>
      `<label><input type="radio" name="look" value="${k}"${k === suggested ? " checked" : ""}>
        <span>${esc(label)}</span></label>`).join(""));
  note(`Suggested for this kind of post. About a minute.`);

  $("#shotGo", wrap).addEventListener("click", async () => {
    const look = wrap.querySelector("input[name=look]:checked")?.value;
    $("#shotGo", wrap).disabled = true;
    note("Sending…");

    let started;
    try {
      const res = await fetch(IMAGE_API, {
        method: "POST",
        headers: { "content-type": "application/json" },
        /* The copy goes in as a subject, not as a prompt: it colours the shot
           without the model trying to illustrate a sentence literally. */
        body: JSON.stringify({ look, style: current?.style, subject: current?.brief || text.slice(0, 200) }),
      });
      started = await res.json();
      if (!res.ok) throw new Error(started.message || `The endpoint returned ${res.status}.`);
      if (started.error) throw new Error(started.message);
    } catch (err) {
      note(err.message);
      $("#shotGo", wrap).disabled = false;
      return;
    }

    const began = Date.now();
    (function poll() {
      openShot.t = setTimeout(async () => {
        if (!document.body.contains(wrap)) return;
        const secs = Math.round((Date.now() - began) / 1000);
        try {
          const r = await (await fetch(`${IMAGE_API}?request=${encodeURIComponent(started.request_id)}`)).json();
          if (r.status === "completed" && r.images?.length) {
            note(`${started.lookLabel} · ${secs}s`);
            $("#shotGrid", wrap).innerHTML = r.images
              .map((u) => `<a href="${esc(u)}" target="_blank" rel="noopener">
                             <img class="slide" src="${esc(u)}" alt="Generated picture"></a>`).join("");
            $("#shotGo", wrap).disabled = false;
            return;
          }
          if (["failed", "canceled", "nsfw"].includes(r.status)) {
            note(r.status === "nsfw"
              ? "Higgsfield refused that one. Try a different look."
              : `It did not finish: ${r.error || r.status}`);
            $("#shotGo", wrap).disabled = false;
            return;
          }
          note(`${r.status === "queued" ? "Queued" : "Drawing"}… ${secs}s`);
          poll();
        } catch {
          note("Lost the connection while it was working.");
          $("#shotGo", wrap).disabled = false;
        }
      }, 3000);
    })();
  });
}
