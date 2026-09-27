import { useEffect, useRef, useState } from "react";
import { JOURNEY } from "../data/offers";
import { usePrefersReducedMotion } from "../lib/motion";
import { useInView } from "../lib/motion";

const STEP_MS = 4200;

/**
 * The connected-system demonstration. Five steps; each shows a compact,
 * understandable vignette of the surface involved. Auto-advances only while
 * on screen and not hovered or focused, stops entirely under reduced motion,
 * and every step is reachable by click or keyboard regardless.
 */
export default function SystemJourney() {
  const reduced = usePrefersReducedMotion();
  const [rootRef, inView] = useInView({ threshold: 0.3, once: false });
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const startedAt = useRef(0);

  const running = !reduced && inView && !paused;

  useEffect(() => {
    if (!running) return;
    let frame = 0;
    startedAt.current = performance.now();
    const tick = (now) => {
      const t = Math.min((now - startedAt.current) / STEP_MS, 1);
      setProgress(t);
      if (t >= 1) {
        setActive((a) => (a + 1) % JOURNEY.length);
        startedAt.current = now;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, active]);

  const choose = (i) => {
    setActive(i);
    setProgress(0);
    startedAt.current = performance.now();
  };

  return (
    <div ref={rootRef} className="gw-journey" onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <ol className="gw-journey__steps" role="tablist" aria-label="The connected customer journey">
        {JOURNEY.map((s, i) => (
          <li key={s.id}>
            <button type="button" role="tab" id={`journey-tab-${s.id}`} aria-selected={active === i} aria-controls="journey-panel" className="gw-journey__step" onClick={() => choose(i)}>
              <span className="gw-journey__n">0{i + 1}</span>
              <span>
                <span className="gw-journey__title">{s.step}</span>
                <span className="gw-journey__detail">{s.detail}</span>
                {active === i && (
                  <span className="gw-journey__bar" aria-hidden="true">
                    <span style={{ width: `${reduced ? 100 : progress * 100}%` }} />
                  </span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ol>
      <div className="gw-journey__stage" id="journey-panel" role="tabpanel" aria-labelledby={`journey-tab-${JOURNEY[active].id}`} key={active}>
        <div className="gw-journey__stage-head">
          <span className="gw-eyebrow">{JOURNEY[active].step}</span>
          <span className="gw-badge gw-badge--muted">{JOURNEY[active].system}</span>
        </div>
        <Vignette id={JOURNEY[active].id} />
        <p className="gw-small gw-muted">{JOURNEY[active].detail}</p>
      </div>
    </div>
  );
}

function Vignette({ id }) {
  if (id === "website") {
    return (
      <div className="gw-vig">
        <div className="gw-vig__row"><b>Build better. Launch faster.</b><small>Hero</small></div>
        <div className="gw-vig__row"><span>Services · Proof · Pricing · FAQ</span><small>Sections</small></div>
        <div className="gw-vig__row" style={{ borderColor: "var(--gw-accent-line)" }}><b>Get a quote →</b><small>One clear route</small></div>
      </div>
    );
  }
  if (id === "whatsapp") {
    return (
      <div className="gw-vig">
        <span className="gw-vig__bubble">Hi, I'd like a quote for a new website.</span>
        <span className="gw-vig__bubble gw-vig__bubble--out">Happy to help. Is this a new site or a rebuild, and roughly how many pages?</span>
        <span className="gw-vig__bubble">Rebuild, about six pages.</span>
        <span className="gw-vig__bubble gw-vig__bubble--out">Great. I'll book a 15-minute call. Tomorrow 10am or Thursday 2pm?</span>
      </div>
    );
  }
  if (id === "voice") {
    return (
      <div className="gw-vig">
        <div className="gw-vig__row">
          <span className="gw-vig__wave" aria-hidden="true">
            {[60, 80, 45, 90, 70, 55, 85, 40, 75, 65].map((h, i) => (
              <i key={i} style={{ "--h": `${h}%`, "--d": `${i * 70}ms` }} />
            ))}
          </span>
          <small>Incoming · 00:42</small>
        </div>
        <div className="gw-vig__row"><span>"Is the property a house or a flat, and when did you notice the leak?"</span></div>
        <div className="gw-vig__row"><span>"I can book a survey tomorrow between 8 and 10."</span><small>Booking</small></div>
        <div className="gw-vig__row" style={{ borderColor: "var(--gw-accent-line)" }}><b>Survey booked · SMS confirmation sent</b><small>Outcome</small></div>
      </div>
    );
  }
  if (id === "console") {
    return (
      <div className="gw-vig">
        <div className="gw-vig__cols">
          <div className="gw-vig__col"><b>Backlog</b><div className="gw-vig__card">Is a battery worth it in 2026?</div><div className="gw-vig__card">Heat pump myths</div></div>
          <div className="gw-vig__col"><b>Drafting</b><div className="gw-vig__card gw-vig__card--hot">Start with your data</div></div>
          <div className="gw-vig__col"><b>Review</b><div className="gw-vig__card">Export tariffs compared</div></div>
        </div>
        <div className="gw-vig__field"><span>Excerpt · doubles as meta description</span><div>What your usage data says before anyone quotes you.</div></div>
      </div>
    );
  }
  return (
    <div className="gw-vig">
      <div className="gw-vig__cols">
        <div className="gw-vig__col"><b>New</b><div className="gw-vig__card gw-vig__card--hot">J. Patel · Rebuild, 6 pages</div><div className="gw-vig__card">S. Ahmed · Roof repair</div></div>
        <div className="gw-vig__col"><b>Qualified</b><div className="gw-vig__card">M. Byrne · Call booked Thu</div></div>
        <div className="gw-vig__col"><b>Proposal</b><div className="gw-vig__card">R. Osei · Sent, follow-up Fri</div></div>
      </div>
      <div className="gw-vig__row"><span>Next action: call J. Patel, tomorrow 10:00</span><small>Task</small></div>
    </div>
  );
}
