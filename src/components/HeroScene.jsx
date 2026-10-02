import { useEffect, useRef } from "react";
import OfferIcon from "./OfferIcon";
import { MockSite, MockChat, MockCall, MockConsole, MockBrand, MockFlow } from "./Mockups";
import { usePrefersReducedMotion } from "../lib/motion";

/*
 * The hero's moving picture of a Goodwork build. The product screens fly in
 * from deep in the scene and settle in orbit around the system at the centre;
 * lines light up between them, and small tags ("New enquiry", "Call booked")
 * travel from one part to another through the centre, so the parts are seen
 * working as one thing rather than described.
 *
 * Positions are fractions of the scene's width, in 3D: the screens are real
 * DOM inside a perspective world, and the lines and tags are drawn in 2D
 * over it from the same maths, so they meet the screens wherever the world
 * has turned. Transforms only; it stops when it is off screen, and under
 * reduced motion it is the finished arrangement, still.
 */

const PANELS = [
  { id: "site", icon: "built", Mock: MockSite, x: -0.23, y: -0.27, z: 0.02, w: 0.43 },
  { id: "brand", icon: "brand-guide", Mock: MockBrand, x: 0.28, y: -0.32, z: -0.16, w: 0.2, wide: true },
  { id: "chat", icon: "whatsapp-bot", Mock: MockChat, x: 0.3, y: 0.02, z: 0.12, w: 0.2 },
  { id: "call", icon: "voice-agent", Mock: MockCall, x: 0.2, y: 0.33, z: 0.2, w: 0.15 },
  { id: "flow", icon: "automations", Mock: MockFlow, x: -0.07, y: 0.34, z: -0.05, w: 0.23 },
  { id: "console", icon: "content-console", Mock: MockConsole, x: -0.32, y: 0.13, z: 0.08, w: 0.24 },
];

// What moves between the parts: from, to, and the tag it carries.
const FLOWS = [
  ["chat", "flow", "New enquiry"],
  ["call", "flow", "Call booked"],
  ["flow", "chat", "Follow-up sent"],
  ["site", "flow", "Form submitted"],
  ["console", "site", "Post published"],
  ["brand", "console", "On brand"],
];

const CHIPS = 4;
const FLOW_EVERY = 1.25; // seconds between tags
const FLOW_TIME = 2.6; // seconds a tag takes, source to target

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOut = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// Where each screen starts its flight: far back, off to one side, turned.
const START = PANELS.map((p, i) => {
  const a = (i / PANELS.length) * Math.PI * 2 + 0.6;
  return { x: Math.cos(a) * 1.1, y: Math.sin(a) * 0.8, z: -2.6, ry: (i % 2 ? 1 : -1) * 70, rx: (i % 3) * 20 - 20 };
});

export default function HeroScene() {
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef(null);
  const worldRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    const world = worldRef.current;
    const canvas = canvasRef.current;
    if (!root || !world || !canvas) return;
    const ctx = canvas.getContext("2d");
    const panelEls = PANELS.map((p) => world.querySelector(`[data-panel="${p.id}"]`));
    const chipEls = [...root.querySelectorAll("[data-chip]")];

    let W = 0, H = 0, P = 1, dpr = 1, compact = false;
    const size = () => {
      const r = root.getBoundingClientRect();
      W = r.width;
      H = r.height;
      compact = W < 520;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      P = W * 2.4;
      root.style.perspective = `${P}px`;
    };
    size();

    const shown = (id) => !(compact && PANELS.find((p) => p.id === id)?.wide);

    // Where a point in the world lands on screen, for the current turn of the
    // world: rotateX(ax) rotateY(ay), then perspective P.
    const project = (x, y, z, ax, ay) => {
      const ry = (ay * Math.PI) / 180, rx = (ax * Math.PI) / 180;
      const x1 = x * Math.cos(ry) + z * Math.sin(ry);
      const z1 = -x * Math.sin(ry) + z * Math.cos(ry);
      const y2 = y * Math.cos(rx) - z1 * Math.sin(rx);
      const z2 = y * Math.sin(rx) + z1 * Math.cos(rx);
      const s = P / (P - z2);
      return { x: W / 2 + x1 * s, y: H / 2 + y2 * s, s };
    };

    // A spoke from the centre to a screen, as a gentle curve.
    const spoke = (c, p, i) => {
      const mx = (c.x + p.x) / 2, my = (c.y + p.y) / 2;
      const dx = p.x - c.x, dy = p.y - c.y;
      const bend = (i % 2 ? 1 : -1) * 0.14;
      return { a: c, b: { x: mx - dy * bend, y: my + dx * bend }, c: p };
    };
    const along = (s, u) => {
      const v = 1 - u;
      return { x: v * v * s.a.x + 2 * v * u * s.b.x + u * u * s.c.x, y: v * v * s.a.y + 2 * v * u * s.b.y + u * u * s.c.y };
    };

    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e) => {
      const r = root.getBoundingClientRect();
      pointer.tx = clamp(((e.clientX - r.left) / r.width - 0.5) * 2, -1.5, 1.5);
      pointer.ty = clamp(((e.clientY - r.top) / r.height - 0.5) * 2, -1.5, 1.5);
    };

    const chips = chipEls.map((el) => ({ el, flow: null, born: -1 }));
    let nextFlow = 0, nextAt = 2.4;
    const hits = new Map();

    const draw = (t, still) => {
      const ay = still ? -4 : Math.sin(t * 0.22) * 5 + pointer.x * 7;
      const ax = still ? 3 : Math.cos(t * 0.18) * 2.5 - pointer.y * 5;
      world.style.transform = `rotateX(${ax}deg) rotateY(${ay}deg)`;

      const pts = {};
      PANELS.forEach((p, i) => {
        const el = panelEls[i];
        if (!shown(p.id)) {
          el.style.display = "none";
          return;
        }
        el.style.display = "";
        const k = compact ? 1.15 : 1;
        const arrive = still ? 1 : clamp((t - 0.2 - i * 0.13) / 1.6, 0, 1);
        const e = easeOut(arrive);
        const s = START[i];
        const fx = still ? 0 : Math.sin(t * 0.55 + i * 1.7) * 0.007;
        const fy = still ? 0 : Math.cos(t * 0.5 + i * 1.1) * 0.011;
        const fz = still ? 0 : Math.sin(t * 0.4 + i * 2.3) * 0.02;
        const x = lerp(s.x, p.x * k, e) + fx * e;
        const y = lerp(s.y, p.y * k, e) + fy * e;
        const z = lerp(s.z, p.z, e) + fz * e;
        const ry = lerp(s.ry, -p.x * 24, e) + (still ? 0 : Math.sin(t * 0.45 + i) * 1.5);
        const rx = lerp(s.rx, p.y * 12, e);
        el.style.transform = `translate(-50%, -50%) translate3d(${x * W}px, ${y * W}px, ${z * W}px) rotateY(${ry}deg) rotateX(${rx}deg)`;
        el.style.opacity = String(clamp(arrive * 2.4, 0, 1));
        el.classList.toggle("is-hit", (hits.get(p.id) || 0) > t);
        pts[p.id] = { ...project(x * W, y * W, z * W, ax, ay), arrive };
      });

      // The spokes, and a pulse travelling each one.
      const c = project(0, 0, 0, ax, ay);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const spokes = {};
      PANELS.forEach((p, i) => {
        const q = pts[p.id];
        if (!q) return;
        const sp = spoke(c, q, i);
        spokes[p.id] = sp;
        const g = ctx.createLinearGradient(c.x, c.y, q.x, q.y);
        g.addColorStop(0, "rgba(122, 92, 255, 0.55)");
        g.addColorStop(0.6, "rgba(255, 45, 179, 0.35)");
        g.addColorStop(1, "rgba(255, 107, 94, 0.12)");
        ctx.globalAlpha = clamp((q.arrive - 0.55) * 2.5, 0, 1);
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(sp.a.x, sp.a.y);
        ctx.quadraticCurveTo(sp.b.x, sp.b.y, sp.c.x, sp.c.y);
        ctx.stroke();
        if (!still) {
          const u = 1 - ((t * (0.22 + i * 0.03) + i * 0.37) % 1);
          const d = along(sp, u);
          ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
          ctx.shadowColor = "rgba(160, 130, 255, 0.9)";
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(d.x, d.y, 1.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });
      ctx.globalAlpha = 1;

      // The tags: out of one part, through the centre, into another.
      if (still) return;
      if (t >= nextAt) {
        const free = chips.find((ch) => !ch.flow);
        let tries = FLOWS.length;
        while (free && tries--) {
          const f = FLOWS[nextFlow++ % FLOWS.length];
          if (shown(f[0]) && shown(f[1])) {
            free.flow = f;
            free.born = t;
            free.el.querySelector("span").textContent = f[2];
            break;
          }
        }
        nextAt = t + FLOW_EVERY;
      }
      for (const ch of chips) {
        if (!ch.flow) {
          ch.el.style.opacity = "0";
          continue;
        }
        const age = (t - ch.born) / FLOW_TIME;
        const [from, to] = ch.flow;
        if (age >= 1 || !spokes[from] || !spokes[to]) {
          if (age >= 1) hits.set(to, t + 0.55);
          ch.flow = null;
          ch.el.style.opacity = "0";
          continue;
        }
        const leg = age < 0.5 ? spokes[from] : spokes[to];
        const u = age < 0.5 ? 1 - easeInOut(age * 2) : easeInOut((age - 0.5) * 2);
        const pos = along(leg, u);
        const fade = Math.min(1, age * 8, (1 - age) * 8);
        ch.el.style.opacity = String(fade);
        ch.el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%) scale(${0.85 + 0.15 * fade})`;
      }
    };

    if (reduced) {
      draw(10, true);
      const ro = new ResizeObserver(() => {
        size();
        draw(10, true);
      });
      ro.observe(root);
      return () => ro.disconnect();
    }

    let raf = 0, running = false, last = 0, clock = 0;
    const tick = (now) => {
      clock += Math.min(0.05, (now - last) / 1000);
      last = now;
      pointer.x += (pointer.tx - pointer.x) * 0.05;
      pointer.y += (pointer.ty - pointer.y) * 0.05;
      draw(clock, false);
      raf = requestAnimationFrame(tick);
    };
    const play = () => {
      if (running || document.hidden) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };
    const pause = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    let visible = false;
    const io = new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      if (visible) play();
      else pause();
    });
    io.observe(root);
    const onVis = () => (document.hidden || !visible ? pause() : play());
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pointermove", onMove, { passive: true });
    const ro = new ResizeObserver(size);
    ro.observe(root);
    draw(0, false);

    return () => {
      pause();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointermove", onMove);
    };
  }, [reduced]);

  return (
    <div
      className="gw-hscene"
      ref={rootRef}
      role="img"
      aria-label="An example Goodwork build, as one system: the website, a WhatsApp agent, an AI voice agent, the Content Console, a brand guide and an automation, connected around a centre, with enquiries, bookings and posts moving between them."
    >
      <div className="gw-hscene__grid" aria-hidden="true" />
      <canvas className="gw-hscene__links" ref={canvasRef} aria-hidden="true" />
      <div className="gw-hscene__world" ref={worldRef} aria-hidden="true">
        <div className="gw-hscene__core">
          <span className="gw-hscene__ring gw-hscene__ring--ticks" />
          <span className="gw-hscene__ring" />
          <span className="gw-hscene__ring gw-hscene__ring--arc" />
          <span className="gw-hscene__orb" />
          <span className="gw-hscene__label">Your system</span>
        </div>
        {PANELS.map(({ id, icon, Mock, w }) => (
          <div key={id} className="gw-hscene__panel" data-panel={id} style={{ "--w": w }}>
            <OfferIcon id={icon} className="gw-hscene__badge" />
            <div className="gw-hscene__card">
              <Mock />
            </div>
          </div>
        ))}
      </div>
      <div className="gw-hscene__chips" aria-hidden="true">
        {Array.from({ length: CHIPS }, (_, i) => (
          <div key={i} className="gw-hscene__chip" data-chip>
            <i />
            <span />
          </div>
        ))}
      </div>
    </div>
  );
}
