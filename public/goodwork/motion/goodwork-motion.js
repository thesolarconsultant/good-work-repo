/* ============================================================================
   GOODWORK Motion — auto-wiring runtime.  <script src="goodwork-motion.js" defer>
   On load it scans the whole document and wires every scripted motion from
   data-attributes. Call GOODWORK.init(root) again after injecting dynamic content.
   All effects no-op under prefers-reduced-motion.

   Cheat sheet (add to any element):
     data-gw-reveal            fade+rise in on scroll  (="left|right|scale")
     data-gw-stagger           on a parent: stagger its [data-gw-reveal] kids
     data-gw-count="80"        count up to a number when in view (suffix kept)
     data-gw-ticker="1284"     odometer roll
     data-gw-typing="Hello."   typewriter (add class gw-caret for the cursor)
     data-gw-rotate="a,b,c"    cycle words in place
     data-gw-scramble="TEXT"   decode-from-noise
     data-gw-magnetic          lean toward the cursor
     data-gw-particles         fill an element/canvas with drifting motes
     data-gw-meteors="9"       spawn N falling streaks (element needs .gw-meteors)
     class="gw-ripple"         ripple from the click point
   Plus pure-CSS classes (no JS): gw-shimmer gw-beam gw-pulse gw-glow gw-rainbow
     gw-aurora gw-gradient-text gw-shiny-text gw-marquee gw-float gw-orb
     gw-border-beam gw-shine-border gw-dots
   ========================================================================== */
(function (global) {
  "use strict";
  var REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var IO = "IntersectionObserver" in global;
  var EASE = "cubic-bezier(.22,1,.36,1)";

  function each(root, sel, fn) { Array.prototype.forEach.call(root.querySelectorAll(sel), fn); }
  function onView(el, fn, threshold) {
    if (!IO) { fn(); return; }
    var o = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { fn(); o.disconnect(); } });
    }, { threshold: threshold || 0.2 });
    o.observe(el);
  }

  var M = {
    reveal: function (root) {
      each(root, "[data-gw-stagger]", function (p) {
        Array.prototype.forEach.call(p.querySelectorAll("[data-gw-reveal]"), function (k, i) {
          k.style.transitionDelay = (i * 0.09) + "s";
        });
      });
      each(root, "[data-gw-reveal]", function (el) {
        if (REDUCE) { el.classList.add("gw-in"); return; }
        onView(el, function () { el.classList.add("gw-in"); }, 0.14);
      });
    },
    count: function (root) {
      each(root, "[data-gw-count]", function (el) {
        var raw = el.getAttribute("data-gw-count");
        var m = String(raw).match(/^(\D*)([\d.,]+)(.*)$/);
        if (!m) return;
        var pre = m[1], suf = m[3], target = parseFloat(m[2].replace(/,/g, ""));
        var dec = (m[2].split(".")[1] || "").length;
        var fmt = function (n) { return pre + n.toFixed(dec).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + suf; };
        if (REDUCE) { el.textContent = fmt(target); return; }
        onView(el, function () {
          var t0 = null;
          (function f(ts) {
            if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / 1400);
            el.textContent = fmt(target * (1 - Math.pow(1 - p, 3)));
            if (p < 1) requestAnimationFrame(f); else el.textContent = fmt(target);
          })();
        }, 0.3);
      });
    },
    ticker: function (root) {
      each(root, "[data-gw-ticker]", function (el) {
        var val = String(el.getAttribute("data-gw-ticker"));
        el.style.display = "inline-flex"; el.style.overflow = "hidden";
        el.style.fontVariantNumeric = "tabular-nums"; el.innerHTML = "";
        var strips = [];
        val.split("").forEach(function () {
          var col = document.createElement("span");
          col.style.cssText = "width:.66em;height:1.04em;overflow:hidden;display:inline-block";
          var strip = document.createElement("span");
          strip.style.cssText = "display:flex;flex-direction:column;transition:transform 1.2s " + EASE;
          for (var d = 0; d < 10; d++) { var s = document.createElement("span"); s.textContent = d; s.style.cssText = "height:1.04em;line-height:1.04em;text-align:center"; strip.appendChild(s); }
          col.appendChild(strip); el.appendChild(col); strips.push(strip);
        });
        function roll() {
          val.split("").forEach(function (d, i) {
            setTimeout(function () { strips[i].style.transform = "translateY(-" + (parseInt(d, 10) * 1.04) + "em)"; }, 80 + i * 130);
          });
        }
        if (REDUCE) { roll(); return; }
        onView(el, roll, 0.4);
      });
    },
    typing: function (root) {
      each(root, "[data-gw-typing]", function (el) {
        var full = el.getAttribute("data-gw-typing"); var host = el;
        var out = document.createElement("span"); el.textContent = ""; el.appendChild(out);
        function type() { out.textContent = ""; var i = 0; var iv = setInterval(function () { out.textContent = full.slice(0, ++i); if (i >= full.length) clearInterval(iv); }, 55); }
        if (REDUCE) { out.textContent = full; return; }
        onView(host, function () { type(); }, 0.4);
      });
    },
    rotate: function (root) {
      each(root, "[data-gw-rotate]", function (el) {
        var words = el.getAttribute("data-gw-rotate").split(",");
        if (REDUCE || words.length < 2) { el.textContent = words[0]; return; }
        el.textContent = words[0]; el.style.display = "inline-block";
        el.style.transition = "opacity .3s,transform .3s"; var i = 0;
        setInterval(function () {
          el.style.opacity = 0; el.style.transform = "translateY(.4em)";
          setTimeout(function () { i = (i + 1) % words.length; el.textContent = words[i]; el.style.opacity = 1; el.style.transform = "none"; }, 300);
        }, 2000);
      });
    },
    scramble: function (root) {
      var CH = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&";
      each(root, "[data-gw-scramble]", function (el) {
        var target = el.getAttribute("data-gw-scramble");
        if (REDUCE) { el.textContent = target; return; }
        function run() { var it = 0; var iv = setInterval(function () {
          el.textContent = target.split("").map(function (c, i) { return i < it ? c : (c === " " ? " " : CH[Math.floor(Math.random() * CH.length)]); }).join("");
          it += 1 / 3; if (it >= target.length) { el.textContent = target; clearInterval(iv); } }, 40); }
        onView(el, run, 0.4);
      });
    },
    magnetic: function (root) {
      if (REDUCE) return;
      each(root, "[data-gw-magnetic]", function (el) {
        el.style.transition = "transform .18s " + EASE;
        var s = parseFloat(el.getAttribute("data-gw-magnetic")) || 0.3;
        el.addEventListener("pointermove", function (e) { var r = el.getBoundingClientRect();
          el.style.transform = "translate(" + ((e.clientX - r.left - r.width / 2) * s) + "px," + ((e.clientY - r.top - r.height / 2) * s * 1.3) + "px)"; });
        el.addEventListener("pointerleave", function () { el.style.transform = ""; });
      });
    },
    ripple: function (root) {
      each(root, ".gw-ripple", function (el) {
        el.addEventListener("pointerdown", function (e) {
          var r = el.getBoundingClientRect(); var s = document.createElement("span");
          s.className = "gw-ink"; s.style.left = (e.clientX - r.left) + "px"; s.style.top = (e.clientY - r.top) + "px";
          el.appendChild(s); setTimeout(function () { s.remove(); }, 700);
        });
      });
    },
    meteors: function (root) {
      each(root, "[data-gw-meteors]", function (el) {
        if (REDUCE) return; var n = parseInt(el.getAttribute("data-gw-meteors"), 10) || 8;
        el.classList.add("gw-meteors");
        for (var i = 0; i < n; i++) { var m = document.createElement("i"); m.className = "gw-meteor";
          m.style.left = (Math.random() * 100) + "%"; m.style.animationDuration = (1.2 + Math.random() * 1.6) + "s";
          m.style.animationDelay = (Math.random() * 2.2) + "s"; el.appendChild(m); }
      });
    },
    particles: function (root) {
      if (REDUCE) return;
      each(root, "[data-gw-particles]", function (host) {
        var cv = host.tagName === "CANVAS" ? host : host.appendChild(document.createElement("canvas"));
        var w = cv.width = host.clientWidth || 240, h = cv.height = host.clientHeight || 130, x = cv.getContext("2d"), ps = [];
        var col = getComputedStyle(host).getPropertyValue("--accent").trim() || "#3366FF";
        for (var i = 0; i < Math.round(w * h / 680); i++) ps.push({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.6 + .4, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35 });
        (function draw() { x.clearRect(0, 0, w, h); for (var i = 0; i < ps.length; i++) { var p = ps[i]; p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > w) p.vx *= -1; if (p.y < 0 || p.y > h) p.vy *= -1; x.beginPath(); x.arc(p.x, p.y, p.r, 0, 7); x.fillStyle = col; x.globalAlpha = .8; x.fill(); } requestAnimationFrame(draw); })();
      });
    }
  };

  var GOODWORK = {
    version: "1.0.0",
    init: function (root) {
      root = root || document;
      for (var k in M) if (M.hasOwnProperty(k)) { try { M[k](root); } catch { /* keep going */ } }
      return GOODWORK;
    }
  };
  global.GOODWORK = GOODWORK;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { GOODWORK.init(); });
  else GOODWORK.init();
})(window);

/* Back-compat: snippets copied before the rename still call OMNIV.init(). */
try { window.OMNIV = window.GOODWORK; } catch { /* no window (SSR) */ }
