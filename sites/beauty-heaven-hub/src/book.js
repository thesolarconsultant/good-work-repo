/* Beauty Heaven Hub: the booking page.
   Treatments and prices come from /book/services.json (written by build.mjs
   from Phorest); free times come live from /api/availability/. Four steps:
   treatment, who, when, confirm. Confirming on the site only appears when
   data/booking-rules.json turns it on (services.json confirmOnSite), and only
   for treatments a client may book alone; otherwise the last step offers
   WhatsApp or Phorest and nothing typed here is sent anywhere. */
(function () {
  "use strict";
  var root = document.getElementById("booker");
  if (!root) return;

  var TZ = "Europe/London";
  var data = null;
  var q = new URLSearchParams(location.search);
  var state = { service: q.get("s") || "", cat: q.get("c") || "", staff: q.get("p") || "", group: "", search: "", week: 0, day: "", slot: null, slots: null, loading: false, error: false, tries: 0 };

  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var money = function (n) {
    return "£" + Number(n).toLocaleString("en-GB", { minimumFractionDigits: Number.isInteger(Number(n)) ? 0 : 2, maximumFractionDigits: 2 });
  };
  var mins = function (m) {
    if (!m) return "";
    var h = Math.floor(m / 60), r = m % 60;
    return h ? h + " hr" + (r ? " " + r + " min" : "") : r + " min";
  };

  // Dates are handled as London calendar days ("2026-10-01").
  var dayFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
  var today = dayFmt.format(new Date());
  var addDays = function (d, n) {
    var t = new Date(d + "T12:00:00Z");
    t.setUTCDate(t.getUTCDate() + n);
    return t.toISOString().slice(0, 10);
  };
  var dayLabel = function (d, opts) {
    return new Date(d + "T12:00:00Z").toLocaleDateString("en-GB", Object.assign({ timeZone: "UTC" }, opts));
  };
  // Phorest may send a zoned time or a wall-clock time. Either way, show the
  // London day and time.
  var zoned = /([zZ]|[+-]\d\d:?\d\d)$/;
  var slotDay = function (s) {
    return zoned.test(s) ? dayFmt.format(new Date(s)) : s.slice(0, 10);
  };
  var slotTime = function (s) {
    return zoned.test(s) ? new Date(s).toLocaleTimeString("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }) : s.slice(11, 16);
  };
  var future = function (s) {
    return zoned.test(s) ? new Date(s).getTime() > Date.now() : true;
  };

  function findService(id) {
    for (var g = 0; g < data.groups.length; g++) {
      var G = data.groups[g];
      for (var c = 0; c < G.cats.length; c++) {
        var C = G.cats[c];
        for (var i = 0; i < C.items.length; i++) if (C.items[i].id === id) return { group: G, cat: C, item: C.items[i] };
      }
    }
    return null;
  }
  function findCat(id) {
    for (var g = 0; g < data.groups.length; g++) {
      for (var c = 0; c < data.groups[g].cats.length; c++) if (data.groups[g].cats[c].id === id) return { group: data.groups[g], cat: data.groups[g].cats[c] };
    }
    return null;
  }
  function priceFor(item, staffId) {
    if (item.price == null) return "";
    if (staffId) {
      for (var i = 0; i < item.staff.length; i++) if (item.staff[i][0] === staffId) return money(item.staff[i][1]);
    }
    var all = item.staff.map(function (x) { return x[1]; });
    if (!all.length) return money(item.price);
    var lo = Math.min.apply(null, all);
    return (all.some(function (p) { return p !== all[0]; }) ? "from " : "") + money(lo);
  }
  function whoName(id) {
    return id ? data.staff[id] || "" : "";
  }

  function syncUrl() {
    var p = new URLSearchParams();
    if (state.service) p.set("s", state.service);
    else if (state.cat) p.set("c", state.cat);
    if (state.service && state.staff) p.set("p", state.staff);
    var qs = p.toString();
    history.replaceState(null, "", location.pathname + (qs ? "?" + qs : ""));
  }

  // ------------------------------------------------------------ rendering --
  function step(n, title, body, done) {
    return '<section class="bstep' + (done ? " bstep--done" : "") + '" id="bstep-' + n + '"><header class="bstep__head"><span class="bstep__n">' + n + '</span><h2>' + title + "</h2></header>" + body + "</section>";
  }

  function stepTreatment() {
    var found = state.service && findService(state.service);
    if (found) {
      var it = found.item;
      return step(1, "Treatment", '<div class="bpick"><div><strong>' + esc(it.name) + '</strong><span class="micro">' + esc(found.cat.title) + (it.mins ? " · " + mins(it.mins) : "") + '</span></div><button type="button" class="blink" data-act="change-service">Change</button></div>', true);
    }
    var s = state.search.trim().toLowerCase();
    var list = "";
    if (s.length > 1) {
      var hits = [];
      data.groups.forEach(function (G) {
        G.cats.forEach(function (C) {
          C.items.forEach(function (it) {
            if ((it.name + " " + C.title).toLowerCase().indexOf(s) > -1) hits.push({ cat: C, item: it });
          });
        });
      });
      list = hits.length
        ? '<ul class="items bitems">' + hits.slice(0, 40).map(function (h) { return itemButton(h.item, h.cat, true); }).join("") + "</ul>"
        : '<p class="small">Nothing matches "' + esc(state.search) + '". Try another word, or pick a section.</p>';
    } else {
      var inCat = state.cat && findCat(state.cat);
      var group = state.group || (inCat ? inCat.group.slug : "");
      var chips = '<nav class="chips bchips" aria-label="Sections">' + data.groups.map(function (G) {
        return '<button type="button" data-act="group" data-id="' + G.slug + '" aria-pressed="' + (G.slug === group) + '">' + esc(G.name) + "</button>";
      }).join("") + "</nav>";
      var G = data.groups.filter(function (x) { return x.slug === group; })[0];
      var cats = G ? G.cats.slice() : [];
      if (inCat && G && inCat.group === G) cats.sort(function (a, b) { return (b.id === state.cat) - (a.id === state.cat); });
      list = chips + (G
        ? cats.map(function (C) {
            return '<div class="bcat"><h3>' + esc(C.title) + "</h3>" + (C.consult ? '<p class="small">A consultation comes first for this treatment.</p>' : "") + '<ul class="items bitems">' + C.items.map(function (it) { return itemButton(it, C); }).join("") + "</ul></div>";
          }).join("")
        : '<p class="small">Choose a section, or search above.</p>');
    }
    return step(1, "Choose a treatment", '<label class="bsearch"><span class="micro">Search</span><input type="search" id="bsearch" placeholder="For example: brows, gel, facial" value="' + esc(state.search) + '" autocomplete="off"></label>' + list, false);
  }

  function itemButton(it, C, showCat) {
    var d = [showCat ? esc(C.title) : "", mins(it.mins)].filter(Boolean).join(" · ");
    return '<li><button type="button" data-act="service" data-id="' + esc(it.id) + '"><span class="n">' + esc(it.name) + '</span><span class="d">' + d + '</span><span class="p">' + priceFor(it) + "</span></button></li>";
  }

  function stepWho(item) {
    var opts = [{ id: "", name: "Anyone available", price: priceFor(item) }].concat(item.staff.map(function (x) {
      return { id: x[0], name: whoName(x[0]), price: x[1] == null ? "" : money(x[1]) };
    }));
    if (item.staff.length === 1) opts = opts.slice(1);
    return step(2, "Who would you like?", '<div class="bwho">' + opts.map(function (o) {
      return '<button type="button" data-act="staff" data-id="' + esc(o.id) + '" aria-pressed="' + (o.id === state.staff) + '"><span>' + esc(o.name) + "</span>" + (o.price ? '<span class="p">' + o.price + "</span>" : "") + "</button>";
    }).join("") + "</div>", false);
  }

  function stepWhen() {
    var start = addDays(today, state.week * 7);
    var days = [];
    for (var i = 0; i < 7; i++) days.push(addDays(start, i));
    var byDay = {};
    (state.slots || []).forEach(function (s) {
      if (!future(s.start)) return;
      var d = slotDay(s.start);
      var t = slotTime(s.start);
      byDay[d] = byDay[d] || {};
      if (!byDay[d][t]) byDay[d][t] = s; // "anyone": Phorest's first pick for that time
    });
    var firstOpen = days.filter(function (d) { return byDay[d]; })[0];
    if (!state.day || days.indexOf(state.day) < 0 || (!byDay[state.day] && firstOpen)) state.day = firstOpen || days[0];

    var nav = '<div class="bweek"><button type="button" class="blink" data-act="week" data-id="-1"' + (state.week === 0 ? " disabled" : "") + '>‹ Earlier</button><span class="micro">' + dayLabel(days[0], { day: "numeric", month: "short" }) + " – " + dayLabel(days[6], { day: "numeric", month: "short" }) + '</span><button type="button" class="blink" data-act="week" data-id="1">Later ›</button></div>';
    var body;
    if (state.loading || state.slots === null) {
      body = '<p class="small bloading">Checking the diary…</p>';
    } else if (state.error) {
      body = '<p class="note">We couldn\'t reach the diary just now. Try again, or ' + fallbackLinks() + ".</p>";
    } else {
      var tabs = '<div class="bdays" role="tablist">' + days.map(function (d) {
        var n = byDay[d] ? Object.keys(byDay[d]).length : 0;
        return '<button type="button" role="tab" data-act="day" data-id="' + d + '" aria-selected="' + (d === state.day) + '"' + (n ? "" : ' class="is-empty"') + '><span class="micro">' + dayLabel(d, { weekday: "short" }) + "</span><strong>" + dayLabel(d, { day: "numeric" }) + "</strong><span class=\"bdays__n\">" + (n ? n + " free" : "—") + "</span></button>";
      }).join("") + "</div>";
      var times = byDay[state.day] ? Object.keys(byDay[state.day]).sort() : [];
      var parts = [["Morning", function (t) { return t < "12:00"; }], ["Afternoon", function (t) { return t >= "12:00" && t < "17:00"; }], ["Evening", function (t) { return t >= "17:00"; }]];
      var grid = times.length
        ? parts.map(function (p) {
            var ts = times.filter(p[1]);
            return ts.length ? '<div class="btimes"><span class="micro">' + p[0] + "</span><div>" + ts.map(function (t) {
              var s = byDay[state.day][t];
              var on = state.slot && state.slot.start === s.start && state.slot.staff === s.staff;
              return '<button type="button" data-act="slot" data-start="' + esc(s.start) + '" data-staff="' + esc(s.staff) + '" aria-pressed="' + !!on + '">' + t + "</button>";
            }).join("") + "</div></div>" : "";
          }).join("")
        : firstOpen
          ? '<p class="small">No free times on this day. Try another day.</p>'
          : '<p class="small">No free times this week. <button type="button" class="blink" data-act="week" data-id="1">Try next week ›</button></p>';
      body = (form.error && !state.slot ? '<p class="note berror" role="alert">' + esc(form.error) + "</p>" : "") + tabs + grid;
    }
    return step(3, "Pick a time", nav + body, false);
  }

  function fallbackLinks(text) {
    var found = findService(state.service);
    var cat = found ? found.cat.id : "";
    var wa = data.whatsapp ? '<a href="https://wa.me/' + data.whatsapp + "?text=" + encodeURIComponent(text || "Hi Beauty Heaven, I'd like to book" + (found ? " " + found.item.name : "")) + '">message us on WhatsApp</a>' : "";
    var ph = '<a href="' + esc(cat ? data.phorest.category + cat : data.phorest.home) + '">book on our booking partner\'s page</a>';
    return wa ? wa + " or " + ph : ph;
  }

  function stepConfirm(found) {
    var s = state.slot;
    var it = found.item;
    var when = dayLabel(slotDay(s.start), { weekday: "long", day: "numeric", month: "long" }) + " at " + slotTime(s.start);
    var who = whoName(s.staff);
    var price = priceFor(it, s.staff);
    var rows = [["Treatment", esc(it.name)], ["With", esc(who || "Our team")], ["When", esc(when)]];
    if (it.mins) rows.push(["Takes", mins(it.mins)]);
    if (price) rows.push(["Price", price]);
    var notes = "";
    if (found.cat.consult) notes += '<p class="note">A consultation comes first, so we can make sure this is right for you.</p>';
    if (found.cat.patch) notes += '<p class="note">A patch test is needed before your first treatment.</p>';
    var msg = "Hi Beauty Heaven, I'd like to book " + it.name + (who ? " with " + who : "") + " on " + when + ". My name is ";
    var body = '<dl class="bsum">' + rows.map(function (r) { return "<div><dt class=\"micro\">" + r[0] + "</dt><dd>" + r[1] + "</dd></div>"; }).join("") + "</dl>" + notes;
    if (state.done) return step(4, "Booked", doneMessage(found, when, who), true);
    if (data.confirmOnSite && it.confirm) return step(4, "Check and confirm", body + bookForm(found), false);
    if (!data.confirmOnSite) {
      body += '<p class="tbc">Draft: confirming right here switches on once it has been tested. Until then, these buttons finish the booking.</p>';
    } else {
      body += '<p class="small">We book this one with you directly, so we can make sure it\'s right for you.</p>';
    }
    body += '<div class="actions">' +
      (data.whatsapp ? '<a class="btn btn--fill" href="https://wa.me/' + data.whatsapp + "?text=" + encodeURIComponent(msg) + '"><span>Request this time on WhatsApp</span> <span class="arr">→</span></a>' : "") +
      '<a class="btn" href="' + esc(data.phorest.category + found.cat.id) + '"><span>Book it on Phorest</span></a></div>' +
      '<p class="small">By booking you agree to our <a href="/policies/">booking policies</a>.</p>';
    return step(4, "Check and confirm", body, false);
  }

  // ---------------------------------------------------- confirm on site --
  var form = { firstName: "", lastName: "", mobile: "", email: "", marketing: false, terms: false, busy: false, error: "", openedAt: 0 };
  function field(id, label, type, ac, extra) {
    return '<label class="bfield"><span class="micro">' + label + '</span><input id="bf-' + id + '" name="' + id + '" type="' + type + '" autocomplete="' + ac + '" value="' + esc(form[id]) + '"' + (extra || "") + "></label>";
  }
  function bookForm(found) {
    if (!form.openedAt) form.openedAt = Date.now();
    return '<form class="bform" id="bform" novalidate>' +
      '<div class="bform__row">' + field("firstName", "First name", "text", "given-name", " required") + field("lastName", "Last name", "text", "family-name", " required") + "</div>" +
      '<div class="bform__row">' + field("mobile", "Mobile", "tel", "tel", ' inputmode="tel" required') + field("email", "Email (optional)", "email", "email", "") + "</div>" +
      '<label class="bhp" aria-hidden="true">Leave this empty <input name="website" tabindex="-1" autocomplete="off"></label>' +
      '<label class="bcheck"><input type="checkbox" id="bf-terms"' + (form.terms ? " checked" : "") + '> <span>I agree to the <a href="/policies/" target="_blank">booking policies</a>' + (found.cat.deposit ? ", and that a deposit secures this booking" : "") + ".</span></label>" +
      '<label class="bcheck"><input type="checkbox" id="bf-marketing"' + (form.marketing ? " checked" : "") + '> <span>Send me offers and news now and then (optional).</span></label>' +
      (form.error ? '<p class="note berror" role="alert">' + esc(form.error) + "</p>" : "") +
      '<div class="actions"><button class="btn btn--fill" type="submit"' + (form.busy ? " disabled" : "") + "><span>" + (form.busy ? "Booking…" : found.cat.deposit ? "Continue to deposit" : "Confirm booking") + '</span> <span class="arr">→</span></button></div>' +
      '<p class="small">Your details go straight into our booking system, and are used as our <a href="/privacy/">privacy notice</a> explains.</p></form>';
  }
  function doneMessage(found, when, who) {
    return '<p class="lede">You\'re booked in for ' + esc(found.item.name) + (who ? " with " + esc(who) : "") + " on " + esc(when) + ".</p>" +
      '<p>' + "It's in our diary. Need to change it? " + (data.whatsapp ? '<a href="https://wa.me/' + data.whatsapp + '">Message us on WhatsApp</a> or call ' : "Call ") + '<a href="tel:' + esc(data.phoneHref || "") + '">' + esc(data.phone || "us") + "</a>.</p>" +
      (found.cat.patch ? '<p class="note">A patch test is needed before your first treatment. We\'ll be in touch to arrange it.</p>' : "") +
      '<div class="actions"><a class="btn" href="/"><span>Back to home</span></a></div>';
  }
  function submitBooking(f) {
    var found = findService(state.service);
    ["firstName", "lastName", "mobile", "email"].forEach(function (k) { form[k] = f.elements[k].value.trim(); });
    form.terms = document.getElementById("bf-terms").checked;
    form.marketing = document.getElementById("bf-marketing").checked;
    if (!form.firstName || !form.lastName) form.error = "Please give your first and last name.";
    else if (!/^(\+?44|0)7\d{9}$/.test(form.mobile.replace(/[\s()-]/g, ""))) form.error = "Please give a UK mobile number, starting 07.";
    else if (!form.terms) form.error = "Please tick to agree to the booking policies.";
    else form.error = "";
    if (form.error) return render();
    form.busy = true;
    render();
    fetch("/api/book/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceId: found.item.id, staffId: state.slot.staff, start: state.slot.start, firstName: form.firstName, lastName: form.lastName, mobile: form.mobile, email: form.email, marketing: form.marketing, terms: form.terms, openedAt: form.openedAt, website: f.elements.website.value }),
    })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        form.busy = false;
        var j = res.j;
        if (j.status === "deposit" && j.url) { location.href = j.url; return; }
        if (j.status === "confirmed") { state.done = true; render(); scrollTo(4); return; }
        if (j.status === "taken") {
          form.error = "Sorry, someone has just taken that time. Please pick another.";
          state.slot = null;
          loadSlots(false);
          scrollTo(3);
          return;
        }
        form.error = j.error || "Something went wrong. Nothing has been booked. Please try again, or message us.";
        render();
      })
      .catch(function () {
        form.busy = false;
        form.error = "We couldn't reach the diary. Nothing has been booked. Please try again, or message us.";
        render();
      });
  }
  root.addEventListener("submit", function (e) {
    if (e.target.id !== "bform") return;
    e.preventDefault();
    if (!form.busy) submitBooking(e.target);
  });
  // keep typed details if the page redraws
  root.addEventListener("change", function (e) {
    if (e.target.id === "bf-terms") form.terms = e.target.checked;
    else if (e.target.id === "bf-marketing") form.marketing = e.target.checked;
  });

  function render() {
    var parts = [stepTreatment()];
    var found = state.service && findService(state.service);
    if (found && !found.item.staff.length) {
      // Nobody is set up to take this one online in Phorest, so there are no
      // times to show. Say so and offer a person instead.
      parts.push(step(2, "Book with us directly", '<p class="note">This one is booked with a member of the team, so we can find the right person and time for you.</p><div class="actions">' +
        (data.whatsapp ? '<a class="btn btn--fill" href="https://wa.me/' + data.whatsapp + "?text=" + encodeURIComponent("Hi Beauty Heaven, I'd like to book " + found.item.name) + '"><span>Message us on WhatsApp</span> <span class="arr">→</span></a>' : "") +
        '<a class="btn" href="tel:' + esc(data.phoneHref || "") + '"><span>Call ' + esc(data.phone || "us") + "</span></a></div>", false));
    } else if (found) {
      parts.push(stepWho(found.item));
      parts.push(stepWhen());
      if (state.slot) parts.push(stepConfirm(found));
    }
    var focus = document.activeElement && document.activeElement.id === "bsearch";
    var caret = focus ? document.activeElement.selectionStart : 0;
    root.innerHTML = parts.join("");
    if (focus) {
      var el = document.getElementById("bsearch");
      el.focus();
      el.setSelectionRange(caret, caret);
    }
  }

  function scrollTo(n) {
    var el = document.getElementById("bstep-" + n);
    if (el) el.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  }

  // --------------------------------------------------------------- diary --
  var seq = 0;
  function loadSlots(auto) {
    var mine = ++seq;
    state.loading = true;
    state.error = false;
    state.slots = null;
    render();
    var p = new URLSearchParams({ service: state.service, from: addDays(today, state.week * 7) });
    if (state.staff) p.set("staff", state.staff);
    fetch("/api/availability/?" + p.toString())
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (j) {
        if (mine !== seq) return;
        state.loading = false;
        state.slots = j.slots || [];
        // On the first look, skip ahead past fully booked weeks (up to a month).
        if (auto && !state.slots.some(function (s) { return future(s.start); }) && state.week < 4) {
          state.week++;
          return loadSlots(true);
        }
        render();
      })
      .catch(function () {
        if (mine !== seq) return;
        state.loading = false;
        state.error = true;
        state.slots = [];
        render();
      });
  }

  // -------------------------------------------------------------- events --
  root.addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]");
    if (!b || b.disabled) return;
    var act = b.getAttribute("data-act"), id = b.getAttribute("data-id");
    if (act === "group") {
      state.group = id;
      state.cat = "";
      render();
    } else if (act === "service") {
      state.service = id;
      var f = findService(id);
      state.cat = f.cat.id;
      state.staff = f.item.staff.length === 1 ? f.item.staff[0][0] : "";
      state.week = 0; state.day = ""; state.slot = null;
      syncUrl();
      if (f.item.staff.length) loadSlots(true);
      else render();
      scrollTo(2);
    } else if (act === "change-service") {
      var g = findService(state.service);
      if (g) state.group = g.group.slug;
      state.service = ""; state.slot = null; state.slots = null;
      syncUrl();
      render();
      scrollTo(1);
    } else if (act === "staff") {
      state.staff = id;
      state.week = 0; state.day = ""; state.slot = null;
      syncUrl();
      loadSlots(true);
      scrollTo(3);
    } else if (act === "week") {
      state.week = Math.max(0, state.week + Number(id));
      state.day = ""; state.slot = null;
      loadSlots(false);
    } else if (act === "day") {
      state.day = id;
      state.slot = null;
      render();
    } else if (act === "slot") {
      state.slot = { start: b.getAttribute("data-start"), staff: b.getAttribute("data-staff") };
      form.error = "";
      render();
      scrollTo(4);
    }
  });
  root.addEventListener("input", function (e) {
    if (e.target.id && e.target.id.indexOf("bf-") === 0 && e.target.id.slice(3) in form) form[e.target.id.slice(3)] = e.target.value;
    if (e.target.id !== "bsearch") return;
    state.search = e.target.value;
    render();
  });

  // ---------------------------------------------------------------- start --
  fetch("/book/services.json")
    .then(function (r) { return r.json(); })
    .then(function (d) {
      data = d;
      if (!d.live) {
        root.innerHTML = '<p class="note">Live booking isn\'t available on this copy of the site. You can <a href="' + esc(d.phorest.home) + '">book on our booking partner\'s page</a>.</p>';
        return;
      }
      var f = state.service && findService(state.service);
      if (!f) state.service = "";
      if (f && state.staff && !f.item.staff.some(function (x) { return x[0] === state.staff; })) state.staff = "";
      if (f && f.item.staff.length === 1) state.staff = f.item.staff[0][0];
      if (!f && state.cat) {
        var c = findCat(state.cat);
        if (c) state.group = c.group.slug;
      }
      if (f && f.item.staff.length) loadSlots(true);
      else render();
    })
    .catch(function () {
      root.innerHTML = '<p class="note">Booking didn\'t load. Please refresh, or call us.</p>';
    });
})();
