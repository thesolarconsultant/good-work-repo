/* Extracted from the approved mock-up (preview-8f3ac21d.html) by build.mjs. Edit the mock-up, not this file. */
(function () {
  "use strict";
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  document.getElementById("year").textContent = new Date().getFullYear();

  /* ---- nav ---- */
  var nav = document.getElementById("nav");
  var menuBtn = document.querySelector(".nav__menu"), panel = document.getElementById("menu");
  menuBtn.addEventListener("click", function () {
    var open = menuBtn.getAttribute("aria-expanded") === "true";
    menuBtn.setAttribute("aria-expanded", String(!open)); panel.hidden = open;
  });
  panel.addEventListener("click", function (e) { if (e.target.tagName === "A") { panel.hidden = true; menuBtn.setAttribute("aria-expanded", "false"); } });

  /* ---- the hero headline rises word by word, once ---- */
  var rise = document.querySelector("[data-rise]");
  if (rise && !reduce) {
    var i = 0;
    rise.innerHTML = rise.innerHTML.replace(/(<br\s*\/?>|<b>[^<]*<\/b>|[^\s<>]+)/g, function (m) {
      if (/^<br/i.test(m)) return m;
      return '<span class="w" style="animation-delay:' + (0.15 + i++ * 0.16) + 's">' + m + "</span>";
    });
  }


  /* ---- the scroll story: scroll position picks the beat; the stage stays pinned ---- */
  (function () {
    var story = document.getElementById("story"), stage = document.getElementById("stage");
    if (!story || reduce) return;
    story.classList.add("story--live");
    var beats = story.querySelectorAll("[data-beat]"), imgs = story.querySelectorAll("[data-beat-img]"), dots = story.querySelectorAll(".story__dots i");
    var N = 5, current = -1, tick = false;
    function show(n) {
      if (n === current) return; current = n;
      beats.forEach(function (b) { b.classList.toggle("is-on", parseInt(b.dataset.beat, 10) === n); });
      imgs.forEach(function (im) { im.classList.toggle("is-on", parseInt(im.dataset.beatImg, 10) === Math.min(n, 3)); });
      dots.forEach(function (d, k) { d.classList.toggle("is-on", k === n); });
      story.querySelector(".story__arch").style.opacity = n === 4 ? "0" : "1";
    }
    function update() {
      var top = story.offsetTop, range = story.offsetHeight - innerHeight;
      var p = Math.max(0, Math.min(1, (scrollY - top) / Math.max(1, range)));
      stage.style.setProperty("--p", String(p));
      show(Math.min(N - 1, Math.floor(p * N)));
      tick = false;
    }
    addEventListener("scroll", function () { if (!tick) { tick = true; requestAnimationFrame(update); } }, { passive: true });
    addEventListener("resize", update);
    update();
    // a link to #fork should land on the fork beat, not the top of the story
    document.querySelectorAll('a[href="#fork"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        scrollTo({ top: story.offsetTop + (story.offsetHeight - innerHeight) * 0.86, behavior: "smooth" });
      });
    });
  })();

  /* ---- the fork: choose a world; the page personalises below it ---- */
  var body = document.body;
  var arches = document.querySelectorAll("[data-choose]");
  function choose(journey, scroll) {
    body.setAttribute("data-journey", journey);
    arches.forEach(function (a) { a.setAttribute("aria-pressed", String(a.dataset.choose === journey)); });
    try { localStorage.setItem("bh-journey", journey); } catch (e) {}
    if (scroll) {
      var target = document.getElementById(journey);
      if (target) target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
  }
  arches.forEach(function (a) {
    a.addEventListener("click", function () { choose(a.dataset.choose, true); });
    a.addEventListener("pointermove", function (e) {
      var r = a.getBoundingClientRect();
      a.style.setProperty("--sx", ((e.clientX - r.left) / r.width * 100) + "%");
      a.style.setProperty("--sy2", ((e.clientY - r.top) / r.height * 100) + "%");
    });
  });
  document.querySelectorAll("[data-journey-link]").forEach(function (l) {
    l.addEventListener("click", function () { choose(l.dataset.journeyLink, false); });
  });
  try {
    var saved = localStorage.getItem("bh-journey");
    if (saved === "treatments" || saved === "academy") choose(saved, false);
  } catch (e) {}

  /* ---- reviews: the statement sharpens word by word when it arrives ---- */
  var loved = document.querySelector("[data-loved]");
  if (loved) {
    loved.innerHTML = loved.innerHTML.replace(/(<b>[^<]*<\/b>|[^\s<>]+)/g, '<span class="w">$1</span>');
    var ws = loved.querySelectorAll(".w");
    var sharpen = function () { ws.forEach(function (w, k) { w.style.transitionDelay = (k * 0.14) + "s"; }); loved.classList.add("on"); };
    if (reduce || !("IntersectionObserver" in window)) sharpen();
    else { var lio = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { sharpen(); lio.disconnect(); } }, { threshold: 0.5 }); lio.observe(loved); }
    var track = document.getElementById("railTrack"); track.innerHTML += track.innerHTML;
  }

  /* ---- the arc gallery: the scroll turns it; drag and the arrows nudge it ---- */
  (function () {
    var root = document.getElementById("gal"); if (!root) return;
    var section = document.getElementById("hub");
    var cards = Array.prototype.slice.call(root.querySelectorAll(".gal__card"));
    var N = cards.length, pos = 0, target = 0, nudge = 0, raf = null;
    var down = false, moved = false, sx = 0, sc = 0;
    function render() {
      cards.forEach(function (el, k) {
        var o = k - pos; while (o > N / 2) o -= N; while (o < -N / 2) o += N;
        var w = el.offsetWidth || 240;
        el.style.transform = "translate(-50%,-50%) translateX(" + (o * w * 0.86) + "px) translateZ(" + (-Math.abs(o) * 140) + "px) rotateY(" + (-o * 26) + "deg)";
        el.style.opacity = String(Math.max(0, 1 - Math.abs(o) * 0.3));
        el.style.zIndex = String(20 - Math.round(Math.abs(o)));
        el.classList.toggle("is-centre", Math.abs(o) < 0.5);
      });
    }
    // Scroll position through the section maps to just over one full turn, so
    // the arc keeps moving the whole way past rather than finishing early.
    function fromScroll() {
      var r = section.getBoundingClientRect();
      var span = r.height + innerHeight;
      var p = Math.max(0, Math.min(1, (innerHeight - r.top) / span));
      return p * (N + 1) - 1.2;
    }
    function loop() {
      var d = target - pos;
      if (Math.abs(d) < 0.001) { pos = target; render(); raf = null; return; }
      pos += d * 0.12; render(); raf = requestAnimationFrame(loop);
    }
    function set(t, instant) {
      target = t;
      if (instant || reduce) { pos = target; render(); return; }
      if (!raf) raf = requestAnimationFrame(loop);
    }
    function sync() { set(fromScroll() + nudge); }
    addEventListener("scroll", sync, { passive: true });
    addEventListener("resize", function () { sync(); render(); });
    cards.forEach(function (el, k) {
      el.addEventListener("click", function () {
        if (moved) return;
        // clicking a card brings it to the centre, as an offset from the scroll
        var o = k - target; while (o > N / 2) o -= N; while (o < -N / 2) o += N;
        nudge += o; sync();
      });
    });
    root.addEventListener("pointerdown", function (e) { down = true; moved = false; sx = e.clientX; sc = nudge; root.classList.add("drag"); });
    addEventListener("pointermove", function (e) {
      if (!down) return; var d = e.clientX - sx;
      if (Math.abs(d) > 6) moved = true;
      nudge = sc - d / 120; sync();
    });
    addEventListener("pointerup", function () { if (down) { down = false; root.classList.remove("drag"); nudge = Math.round(nudge * 2) / 2; sync(); } });
    document.querySelectorAll("[data-gal]").forEach(function (b) {
      b.addEventListener("click", function () { nudge += parseInt(b.dataset.gal, 10); sync(); });
    });
    sync(); pos = target; render();
  })();

  /* ---- the drawn line: the scroll paints the stem, each leaf opens as it
     passes. One measurement per plant, then it is all CSS custom properties. */
  (function () {
    var plants = Array.prototype.slice.call(document.querySelectorAll("[data-bot]"));
    if (!plants.length) return;
    plants.forEach(function (svg) {
      var stem = svg.querySelector(".bh-bot__stem");
      if (!stem || !stem.getTotalLength) return;
      svg.style.setProperty("--len", stem.getTotalLength());
      svg.classList.add("bh-bot--draw");
      // the plant grows across the section it belongs to
      svg.__host = svg.closest("section") || svg.parentNode;
      if (reduce) svg.style.setProperty("--grow", 1);
    });
    if (reduce) return;
    function grow() {
      plants.forEach(function (svg) {
        var r = svg.__host.getBoundingClientRect();
        // Start when the section is a third of the way up the screen and
        // finish before it leaves, so the plant is never still growing
        // once you have read past it.
        var span = r.height + innerHeight * 0.55;
        var p = Math.max(0, Math.min(1, (innerHeight * 0.85 - r.top) / span));
        svg.style.setProperty("--grow", p.toFixed(3));
      });
    }
    var pending = false;
    addEventListener("scroll", function () {
      if (pending) return; pending = true;
      requestAnimationFrame(function () { grow(); pending = false; });
    }, { passive: true });
    addEventListener("resize", grow);
    grow();
  })();

  /* ---- the accordion ---- */
  (function () {
    var acc = document.getElementById("acc"); if (!acc) return;
    var items = acc.querySelectorAll(".acc__item");
    function open(it) {
      items.forEach(function (x) { x.classList.remove("open"); x.querySelector(".acc__a").style.maxHeight = "0"; x.querySelector(".acc__q").setAttribute("aria-expanded", "false"); });
      if (it) { it.classList.add("open"); var a = it.querySelector(".acc__a"); a.style.maxHeight = a.scrollHeight + "px"; it.querySelector(".acc__q").setAttribute("aria-expanded", "true"); }
    }
    acc.querySelectorAll(".acc__q").forEach(function (q) { q.addEventListener("click", function () { var it = q.parentNode; open(it.classList.contains("open") ? null : it); }); });
    open(items[0]);
  })();

  /* ---- light that moves: the hero halo with the scroll, the photo halos, the cursor halo ---- */
  var root = document.documentElement, ticking = false;
  addEventListener("scroll", function () {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () { if (!reduce) root.style.setProperty("--sy", String(scrollY)); nav.classList.toggle("scrolled", scrollY > 24); ticking = false; });
  }, { passive: true });
  if (!reduce) {
    document.querySelectorAll(".frame").forEach(function (p) {
      var halo = p.querySelector(".halo"); if (!halo) return;
      p.addEventListener("pointermove", function (ev) {
        var r = p.getBoundingClientRect();
        halo.style.setProperty("--hx", (((ev.clientX - r.left) / r.width - 0.5) * 24) + "px");
        halo.style.setProperty("--hy", (((ev.clientY - r.top) / r.height - 0.5) * 24) + "px");
      });
      p.addEventListener("pointerleave", function () { halo.style.setProperty("--hx", "0px"); halo.style.setProperty("--hy", "0px"); });
    });
    if (fine) {
      var cur = document.querySelector(".cursor"), tx = -100, ty = -100, x = -100, y = -100;
      addEventListener("pointermove", function (e) { tx = e.clientX; ty = e.clientY; cur.classList.add("on"); }, { passive: true });
      document.addEventListener("pointerleave", function () { cur.classList.remove("on"); });
      document.addEventListener("pointerover", function (e) { cur.classList.toggle("hot", !!(e.target.closest && e.target.closest("a, button, .gal"))); });
      (function loop() { x += (tx - x) * 0.16; y += (ty - y) * 0.16; cur.style.transform = "translate(" + x + "px," + y + "px) translate(-50%,-50%)"; requestAnimationFrame(loop); })();
    }
  }
})();
