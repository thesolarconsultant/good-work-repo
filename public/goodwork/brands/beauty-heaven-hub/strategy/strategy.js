/* ============================================================================
   The presenter engine.

   A moment fills the screen. Some moments have steps — parts that arrive one
   at a time while the presenter talks. The right arrow takes the next step,
   and when there are none left it moves to the next moment; the left arrow
   walks back, landing each previous moment fully revealed rather than blank.

   Everything a moment needs is declared in the markup:
     data-steps="3"          how many reveals this moment holds
     data-step="2"           show me when the moment reaches step 2
     data-add="1:is-joined"  at step 1, add this class to me
     data-seq                stagger my children in, once I am shown
     data-ground="espresso"  the ground this moment sits on
     data-bare               hide the chrome; this moment is only the idea
   ========================================================================== */
(function () {
  "use strict";

  var deck = document.getElementById("deck");
  var moments = Array.prototype.slice.call(document.querySelectorAll(".moment"));
  var bar = document.querySelector(".bar i");
  var counter = document.getElementById("counter");
  var chapters = Array.prototype.slice.call(document.querySelectorAll(".chapters button"));
  var gridView = document.getElementById("grid");
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  var m = 0, s = 0;
  var stepsOf = moments.map(function (el) { return parseInt(el.dataset.steps || "0", 10); });

  /* ---- the overview, so nothing is ever hunted for in front of a client ---- */
  (function buildGrid() {
    var wrap = gridView.querySelector(".gv");
    moments.forEach(function (el, i) {
      var b = document.createElement("button");
      b.innerHTML = '<span class="mono">' + String(i + 1).padStart(2, "0") + " · " + (el.dataset.chapter || "") +
        '</span><b>' + (el.dataset.title || "") + "</b>";
      b.addEventListener("click", function () { go(i, 0); closeGrid(); });
      wrap.appendChild(b);
    });
  })();
  function openGrid() {
    gridView.classList.add("on");
    Array.prototype.forEach.call(gridView.querySelectorAll(".gv button"), function (b, i) {
      b.classList.toggle("on", i === m);
    });
    var live = gridView.querySelectorAll(".gv button")[m];
    if (live) live.scrollIntoView({ block: "nearest" });
  }
  function closeGrid() { gridView.classList.remove("on"); }

  /* ---- applying a position ---- */
  function apply() {
    moments.forEach(function (el, i) {
      var live = i === m;
      el.classList.toggle("is-live", live);
      el.classList.toggle("is-past", !live);
      el.setAttribute("aria-hidden", live ? "false" : "true");
      if (!live) {
        // reset the moment so it plays again cleanly if we come back forward
        el.querySelectorAll("[data-step]").forEach(function (n) { n.classList.remove("is-on"); });
        el.querySelectorAll("[data-add]").forEach(function (n) {
          n.classList.remove(n.dataset.add.split(":")[1]);
        });
        el.querySelectorAll("[data-seq] > *").forEach(function (n) { n.classList.remove("on"); });
        el.querySelectorAll("[data-until]").forEach(function (n) { n.classList.remove("is-off"); });
      }
    });

    var cur = moments[m];
    cur.querySelectorAll("[data-step]").forEach(function (n) {
      n.classList.toggle("is-on", parseInt(n.dataset.step, 10) <= s);
    });
    cur.querySelectorAll("[data-until]").forEach(function (n) {
      n.classList.toggle("is-off", s > parseInt(n.dataset.until, 10));
    });
    cur.querySelectorAll("[data-add]").forEach(function (n) {
      var bits = n.dataset.add.split(":");
      n.classList.toggle(bits[1], parseInt(bits[0], 10) <= s);
    });
    // sequenced children (a conversation, a list that types itself in)
    cur.querySelectorAll("[data-seq]").forEach(function (host) {
      var need = parseInt(host.dataset.step || "0", 10) <= s;
      Array.prototype.forEach.call(host.children, function (kid, i) {
        if (!need) { kid.classList.remove("on"); return; }
        setTimeout(function () { kid.classList.add("on"); }, reduce ? 0 : 200 + i * 380);
      });
    });

    // a new moment always starts at its own top, however far the last was read
    if (cur.scrollTop) cur.scrollTop = 0;

    // The chrome lives outside the deck, so both the flag and the ground go on
    // the body — on a phone the rails carry the ground behind them, and they
    // have to be the ground of the moment, not of the page.
    var ground = cur.dataset.ground || "ivory";
    deck.setAttribute("data-ground", ground);
    document.body.setAttribute("data-ground", ground);
    document.body.setAttribute("data-bare", cur.hasAttribute("data-bare") ? "1" : "0");

    var pct = ((m + (stepsOf[m] ? s / stepsOf[m] : 0)) / (moments.length - 1)) * 100;
    if (bar) bar.style.setProperty("--p", pct.toFixed(1) + "%");
    if (counter) counter.textContent = String(m + 1).padStart(2, "0") + " / " + String(moments.length).padStart(2, "0");
    chapters.forEach(function (b) { b.classList.toggle("on", b.dataset.chapter === cur.dataset.chapter); });

    fit(cur);
    history.replaceState(null, "", "#" + (m + 1) + (s ? "." + s : ""));
  }

  /* Nothing may clip. A moment is laid out for a generous screen; if the room
     has a 768px projector and a dense moment would run off the top and the
     bottom, it is scaled down a few per cent rather than cropped. Anything
     that needs more than a fifth taking off is a design problem, not a
     display problem, so it is reported in the console rather than hidden. */
  // the sizes where a moment is allowed to scroll instead of being scaled
  function narrow() { return innerWidth <= 760 || innerHeight <= 560; }

  function fit(cur) {
    var wrap = cur.querySelector(".wrap");
    if (!wrap) return;
    // On a phone the moment scrolls. Scaling it down there would shrink type
    // that is already at its floor, to fit a screen it is allowed to exceed.
    if (narrow()) { wrap.style.transform = ""; return; }
    // An image that has not loaded yet reports its natural height, which would
    // scale the moment against a size it is never going to be. Measure again
    // when it lands.
    Array.prototype.forEach.call(cur.querySelectorAll("img"), function (img) {
      if (!img.complete && !img.dataset.refit) {
        img.dataset.refit = "1";
        img.addEventListener("load", function () { fit(cur); }, { once: true });
      }
    });
    wrap.style.transform = "";
    var cs = getComputedStyle(cur);
    var avail = cur.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)
                - (cur.hasAttribute("data-bare") ? 0 : 76);
    var need = wrap.getBoundingClientRect().height;
    if (!need || !avail) return;
    var k = need > avail ? avail / need : 1;
    if (k < 1) {
      wrap.style.transform = "scale(" + Math.max(0.8, k).toFixed(4) + ")";
      if (k < 0.8) console.warn("moment " + (moments.indexOf(cur) + 1) + " needs " + Math.round(need) + "px in " + Math.round(avail));
    }
  }
  addEventListener("resize", function () { fit(moments[m]); });
  addEventListener("load", function () { moments.forEach(fit); });

  function go(i, step) {
    m = Math.max(0, Math.min(moments.length - 1, i));
    s = Math.max(0, Math.min(stepsOf[m], step == null ? 0 : step));
    apply();
  }
  function next() {
    if (s < stepsOf[m]) { s++; apply(); }
    else if (m < moments.length - 1) { go(m + 1, 0); }
  }
  function prev() {
    if (s > 0) { s--; apply(); }
    else if (m > 0) { go(m - 1, stepsOf[m - 1]); }   // land it fully revealed
  }

  /* ---- keys ---- */
  addEventListener("keydown", function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var k = e.key;
    if (gridView.classList.contains("on")) {
      if (k === "Escape" || k === "g") { closeGrid(); e.preventDefault(); }
      return;
    }
    if (k === "ArrowRight" || k === " " || k === "PageDown" || k === "n") { next(); e.preventDefault(); }
    else if (k === "ArrowLeft" || k === "PageUp" || k === "p") { prev(); e.preventDefault(); }
    else if (k === "ArrowDown") { go(m + 1, 0); e.preventDefault(); }
    else if (k === "ArrowUp") { go(m - 1, 0); e.preventDefault(); }
    else if (k === "Home") { go(0, 0); e.preventDefault(); }
    else if (k === "End") { go(moments.length - 1, stepsOf[moments.length - 1]); e.preventDefault(); }
    else if (k === "Escape" || k === "g") { openGrid(); e.preventDefault(); }
    else if (k === "f") {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
      e.preventDefault();
    }
  });

  /* ---- click and swipe, for presenting from an iPad or reading on a phone ---- */
  addEventListener("click", function (e) {
    if (e.target.closest("button, a, .grid-view")) return;
    // On a phone this is a story: the left third goes back, the rest goes on.
    // On a laptop the whole screen advances, the way a clicker does.
    if (narrow() && e.clientX < innerWidth * 0.32) prev();
    else next();
  });
  var sx = 0, sy = 0;
  addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  addEventListener("touchend", function (e) {
    var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) { if (dx < 0) next(); else prev(); }
  }, { passive: true });

  gridView.addEventListener("click", function (e) { if (e.target === gridView) closeGrid(); });
  chapters.forEach(function (b) {
    b.addEventListener("click", function () {
      var first = moments.findIndex(function (el) { return el.dataset.chapter === b.dataset.chapter; });
      if (first >= 0) go(first, 0);
    });
  });

  /* ---- the drawn line needs its own length before it can draw itself ---- */
  document.querySelectorAll(".bot").forEach(function (svg) {
    var stem = svg.querySelector(".bh-bot__stem");
    if (stem && stem.getTotalLength) svg.style.setProperty("--len", stem.getTotalLength());
  });
  /* ---- so do the wires and the arcs ---- */
  document.querySelectorAll(".wire, .arc").forEach(function (p) {
    if (p.getTotalLength) p.style.setProperty("--l", p.getTotalLength());
  });

  /* Exposed so a clicker, a remote or a screenshot pass can drive it. */
  window.DECK = { go: go, next: next, prev: prev, count: moments.length, steps: stepsOf };

  /* ---- open where we left off, or at the start ---- */
  var hash = (location.hash || "").replace("#", "").split(".");
  go(parseInt(hash[0], 10) - 1 || 0, parseInt(hash[1], 10) || 0);
})();
