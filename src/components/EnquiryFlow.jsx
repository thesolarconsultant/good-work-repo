import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import Button from "./Button";
import Stamp from "./Stamp";
import { validate, mailtoFallback, initialValues, displayValue, isEmptyValue, resolveText, submitEnquiry } from "../lib/forms";
import { track } from "../lib/analytics";
import { usePrefersReducedMotion } from "../lib/motion";
import { CONTACT_EMAIL } from "../lib/site";

/**
 * An enquiry as a conversation rather than a wall of boxes.
 *
 * One short screen at a time (the steps live in data/forms.js), each checked
 * before the next, then a review of exactly what will be sent. It posts the
 * same flat fields the classic form does, so the server, the CRM mapping and
 * the plain-text summary in the inbox don't change.
 *
 * - Choices are cards or chips. A pointer pick on a single-choice screen
 *   moves on by itself; arrow keys and Space never do, because that is how a
 *   radio group is browsed. Letters pick options too (A, B, C…).
 * - Enter moves on from any field except a textarea, where Ctrl/⌘+Enter does.
 * - Focus goes to the new screen's first empty field, or else its question,
 *   and one live region says which step this is, so nobody is left on a
 *   button that has just disappeared.
 * - The draft, and where you were in it, survive a refresh.
 * - Only a 2xx counts as sent. Anything else keeps every answer and offers
 *   the whole thing by email.
 */

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const OPTION_TYPES = new Set(["radio", "select", "checkbox-group"]);
const SINGLE_TYPES = new Set(["radio", "select"]);
const LINE_TYPES = new Set(["text", "email", "tel", "url"]);
// Rough seconds per answer, for "about 2 min left". Honest, not precise.
const SECONDS = { textarea: 30, "checkbox-group": 10, radio: 5, select: 5, checkbox: 5 };
const secondsFor = (f) => SECONDS[f.type] ?? 9;
// The sent screen's burst. Fixed values rather than Math.random, so it is the
// same every time: [x, y, rotation, delay, colour].
const BURST = [
  [-150, -70, 220, 0, 0], [-118, -128, -160, 40, 1], [-80, -40, 300, 80, 2], [-64, -150, 120, 20, 3], [-30, -96, -240, 60, 0],
  [-12, -160, 180, 100, 2], [18, -120, -120, 30, 1], [40, -60, 260, 90, 3], [62, -146, -300, 10, 0], [88, -92, 140, 70, 2],
  [112, -132, -200, 50, 1], [138, -54, 320, 110, 3], [156, -104, -90, 0, 2], [-140, -112, 90, 120, 3], [-96, -88, -60, 140, 1],
  [100, -40, 200, 130, 0], [-44, -62, -330, 150, 3], [24, -84, 60, 160, 2],
];
const BURST_COLOURS = ["var(--gw-blue)", "var(--gw-violet)", "var(--gw-magenta)", "var(--gw-coral)"];

const splitItems = (text) =>
  String(text || "")
    .split(/\s*(?:,|;|\n)\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
const splitStages = (text) =>
  String(text || "")
    .split(/\s*(?:→|->|,|;|\n)\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
const same = (a, b) => a.toLowerCase() === b.toLowerCase();

/** Add a quick-pick to the free text, or take it back out. The text stays the user's to edit. */
function toggleItem(text, item) {
  const items = splitItems(text);
  if (items.some((i) => same(i, item))) return items.filter((i) => !same(i, item)).join(", ");
  const kept = String(text || "").replace(/[\s,;]+$/, "");
  return kept ? `${kept}, ${item}` : item;
}

/** Keep only the parts of a saved draft that still fit the form as it is now. */
function fromDraft(form, draft) {
  const out = {};
  for (const f of form.fields) {
    const v = draft?.[f.name];
    if (f.type === "checkbox-group") {
      if (Array.isArray(v)) out[f.name] = v.filter((x) => f.options.some((o) => o.value === x));
    } else if (f.type === "checkbox") {
      if (typeof v === "boolean") out[f.name] = v;
    } else if (typeof v === "string" && (!f.options || v === "" || f.options.some((o) => o.value === v))) {
      out[f.name] = v;
    }
  }
  return out;
}

export default function EnquiryFlow({ form, prefill = {}, source }) {
  const reduced = usePrefersReducedMotion();
  const uid = useId();
  const storageKey = `gw:form:${form.id}`;
  const steps = form.steps;
  const review = steps.length; // the index of the review screen
  const byName = useMemo(() => Object.fromEntries(form.fields.map((f) => [f.name, f])), [form]);

  const [values, setValues] = useState(() => initialValues(form, prefill));
  const [at, setAt] = useState(0);
  const [reached, setReached] = useState(0);
  const [dir, setDir] = useState("next");
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | sending | sent | failed
  const [failure, setFailure] = useState("");
  const [restored, setRestored] = useState(false);
  const [nudge, setNudge] = useState(0);
  const [announcement, setAnnouncement] = useState("");

  const rootRef = useRef(null);
  const panelRef = useRef(null);
  const headingRef = useRef(null);
  const honeypotRef = useRef(null);
  const started = useRef(false);
  // Set by anything the person does to change screens. Restoring a draft on
  // load changes the step too, and that must not scroll the page to the form.
  const moved = useRef(false);
  const pointerAt = useRef(0);
  const advanceTimer = useRef(0);

  // Restore a draft and the step it was on. Prefill wins over the draft for
  // the keys it sets, so a "?topic=crm" link always lands on CRM.
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) || "null");
      if (!saved || typeof saved !== "object") return;
      const draft = fromDraft(form, saved.v === 2 ? saved.values : saved);
      const worthKeeping = Object.entries(draft).some(([k, v]) => !(k in prefill) && !isEmptyValue(v) && v !== false);
      if (!worthKeeping) return;
      setValues((v) => ({ ...v, ...draft, ...prefill }));
      if (saved.v === 2) {
        const clamp = (n) => Math.min(Math.max(Number(n) || 0, 0), review);
        setAt(clamp(saved.at));
        setReached(clamp(Math.max(Number(saved.reached) || 0, Number(saved.at) || 0)));
      }
      setRestored(true);
    } catch {
      // Storage disabled: the form still works, it just won't remember.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    if (status === "sent") return;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({ v: 2, values, at, reached }));
    } catch {
      // As above.
    }
  }, [values, at, reached, status, storageKey]);

  useEffect(() => () => window.clearTimeout(advanceTimer.current), []);

  // A new screen replaces the old one, so focus has to go somewhere on
  // purpose. Only after the person has moved: arriving on the page, even
  // with a restored draft, shouldn't jump to the form.
  const isSent = status === "sent";
  useEffect(() => {
    if (!moved.current) return;
    const root = rootRef.current;
    if (root && root.getBoundingClientRect().top < 0) root.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    const step = steps[at];
    const lead = step && status !== "sent" ? byName[step.fields[0]] : null;
    const input = lead && (LINE_TYPES.has(lead.type) || lead.type === "textarea") && isEmptyValue(values[lead.name]) ? panelRef.current?.querySelector(`[name="${lead.name}"]`) : null;
    (input || headingRef.current)?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [at, isSent]);

  // `value` may be an updater of the current answer, so quick repeated taps
  // never work from a stale copy.
  const set = (name, value) => {
    if (!started.current) {
      started.current = true;
      track("service_enquiry_start", { form: form.id, source });
    }
    setValues((v) => ({ ...v, [name]: typeof value === "function" ? value(v[name]) : value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  };

  function goTo(i, direction) {
    moved.current = true;
    window.clearTimeout(advanceTimer.current);
    setDir(direction || (i > at ? "next" : "back"));
    setAt(i);
    setReached((r) => Math.max(r, i));
    setErrors({});
    setRestored(false);
    setAnnouncement(i === review ? "Review. Check it over, then send it." : `Step ${i + 1} of ${review}. ${resolveText(steps[i].title, values)}`);
  }

  function flag(found) {
    const bad = Object.keys(found);
    setErrors(found);
    setNudge((n) => n + 1);
    setAnnouncement(bad.length === 1 ? "One answer needs attention." : `${bad.length} answers need attention.`);
    panelRef.current?.querySelector(`[name="${bad[0]}"]`)?.focus();
  }

  const stepErrors = (i) => validate(steps[i].fields.map((n) => byName[n]), values);

  function next(event) {
    event?.preventDefault();
    if (at >= review) return;
    const found = stepErrors(at);
    if (Object.keys(found).length) return flag(found);
    goTo(at + 1, "next");
  }

  // The rail and the review's "Change" links. Forward only to screens already
  // seen, and only past one that's complete.
  function jump(i) {
    if (i === at) return;
    if (i > at && at < review) {
      const found = stepErrors(at);
      if (Object.keys(found).length) return flag(found);
    }
    goTo(i);
  }

  function scheduleAdvance() {
    window.clearTimeout(advanceTimer.current);
    const from = at;
    advanceTimer.current = window.setTimeout(() => goTo(from + 1, "next"), reduced ? 150 : 420);
  }

  const step = steps[at];
  const stepFields = step ? step.fields.map((n) => byName[n]) : [];
  const optionFields = stepFields.filter((f) => OPTION_TYPES.has(f.type));
  const keyed = optionFields.length === 1 ? optionFields[0] : null;
  const sole = stepFields.length === 1 ? stepFields[0] : null;
  const autoAdvance = sole && SINGLE_TYPES.has(sole.type) ? sole.name : null;

  function pick(f, value, how) {
    if (f.type === "checkbox-group") {
      set(f.name, (prev) => {
        const current = new Set(prev || []);
        if (current.has(value)) current.delete(value);
        else current.add(value);
        return f.options.filter((o) => current.has(o.value)).map((o) => o.value);
      });
      return;
    }
    set(f.name, value);
    if (how !== "browse" && autoAdvance === f.name) scheduleAdvance();
  }

  const recentPointer = () => Date.now() - pointerAt.current < 1200;

  function onKeyDown(e) {
    if (status === "sent" || at >= review) return;
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      next();
      return;
    }
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const t = e.target;
    if (!(t instanceof HTMLElement) || t.matches("textarea, select, input:not([type='radio']):not([type='checkbox'])")) return;
    if (e.key === "Enter" && t instanceof HTMLInputElement) {
      e.preventDefault();
      next();
      return;
    }
    if (!keyed || e.key.length !== 1) return;
    const i = LETTERS.indexOf(e.key.toUpperCase());
    if (i < 0 || i >= keyed.options.length) return;
    e.preventDefault();
    const o = keyed.options[i];
    pick(keyed, o.value, "key");
    panelRef.current?.querySelector(`input[name="${keyed.name}"][value="${CSS.escape(o.value)}"]`)?.focus();
  }

  async function send() {
    // Bots fill in everything, including a field no person can see.
    if (honeypotRef.current?.value) return;
    const found = validate(form.fields, values);
    const bad = Object.keys(found);
    if (bad.length) {
      goTo(Math.max(0, steps.findIndex((s) => s.fields.includes(bad[0]))), "back");
      setErrors(found);
      return;
    }
    setStatus("sending");
    setFailure("");
    moved.current = true;
    try {
      await submitEnquiry(form, values);
      setStatus("sent");
      track(form.event, { form: form.id, source });
      try {
        sessionStorage.removeItem(storageKey);
      } catch {
        // Nothing to clear.
      }
    } catch (err) {
      setStatus("failed");
      setFailure(err.message || "Something went wrong sending it.");
    }
  }

  function startOver() {
    window.clearTimeout(advanceTimer.current);
    setValues(initialValues(form, prefill));
    setErrors({});
    setRestored(false);
    setReached(0);
    setStatus("idle");
    setFailure("");
    goTo(0, "back");
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      // Nothing to clear.
    }
  }

  if (status === "sent") return <Done form={form} values={values} rootRef={rootRef} headingRef={headingRef} reduced={reduced} />;

  const rail = [...steps, { id: "review", short: "Review" }];
  const progress = Math.max(4, Math.round((at / (review + 1)) * 100));
  const secondsLeft = steps.slice(at).reduce((sum, s) => sum + s.fields.reduce((t, n) => t + secondsFor(byName[n]), 0), 0) + 10;
  const timeLeft = at >= review ? "Last look" : secondsLeft < 50 ? "Under a minute left" : `About ${Math.round(secondsLeft / 60)} min left`;
  const hasTextarea = stepFields.some((f) => f.type === "textarea");

  return (
    <div className="gw-flow" ref={rootRef} onKeyDown={onKeyDown}>
      <div className="gw-flow__top">
        <ol className="gw-flow__rail" aria-label="Steps">
          {rail.map((s, i) => {
            const state = i === at ? "current" : i < at ? "done" : i <= reached ? "seen" : "todo";
            return (
              <li key={s.id} className="gw-flow__pip" data-state={state}>
                <button type="button" onClick={() => jump(i)} disabled={i === at || i > reached} aria-current={i === at ? "step" : undefined} title={s.short}>
                  <span className="gw-flow__pip-dot" aria-hidden="true" />
                  <span className={i === at ? "gw-flow__pip-label" : "gw-sr-only"}>{s.short}</span>
                  {state === "done" && <span className="gw-sr-only">, done</span>}
                </button>
              </li>
            );
          })}
        </ol>
        <p className="gw-flow__count">
          <span>{at < review ? `Step ${at + 1} of ${review}` : "Review"}</span>
          <span aria-hidden="true">·</span>
          <span>{timeLeft}</span>
        </p>
      </div>
      <div className="gw-flow__bar" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      {restored && (
        <p className="gw-flow__restored">
          Welcome back. We kept your answers.{" "}
          <button type="button" className="gw-flow__textbtn" onClick={startOver}>
            Start over
          </button>
        </p>
      )}

      <p className="gw-sr-only" aria-live="polite">
        {announcement}
      </p>

      <div ref={panelRef} key={at} className="gw-flow__panel" data-dir={dir}>
        {step ? (
          <form className="gw-flow__step" onSubmit={next} noValidate data-nudge={nudge ? (nudge % 2 ? "a" : "b") : undefined}>
            <p className="gw-flow__kicker">{resolveText(step.kicker, values)}</p>
            <h3 className="gw-flow__title" tabIndex={-1} ref={headingRef}>
              {resolveText(step.title, values)}
            </h3>
            {(step.help || (at === 0 && form.intro)) && <p className="gw-flow__help">{step.help || form.intro}</p>}

            <div className="gw-flow__fields">
              {stepFields.map((f) => (
                <FlowField
                  key={f.name}
                  f={f}
                  uid={uid}
                  value={values[f.name]}
                  error={errors[f.name]}
                  sole={sole === f}
                  keyed={keyed === f}
                  onChange={(v) => set(f.name, v)}
                  onPick={(v) => pick(f, v, recentPointer() ? "pointer" : "browse")}
                  onRepick={() => {
                    if (recentPointer() && autoAdvance === f.name) scheduleAdvance();
                  }}
                  onPointer={() => {
                    pointerAt.current = Date.now();
                  }}
                />
              ))}
            </div>

            <div className="gw-flow__nav">
              {at > 0 ? (
                <button type="button" className="gw-flow__back" onClick={() => goTo(at - 1, "back")}>
                  ← Back
                </button>
              ) : (
                <span />
              )}
              <div className="gw-flow__go">
                {reached >= review && at < review - 1 && (
                  <Button type="button" variant="secondary" onClick={() => jump(review)}>
                    Back to review
                  </Button>
                )}
                <Button type="submit" arrow>
                  {at === review - 1 ? "Review" : "Next"}
                </Button>
              </div>
            </div>
            <p className="gw-flow__hint" aria-hidden="true">
              {keyed && (
                <>
                  <kbd>A</kbd>–<kbd>{LETTERS[keyed.options.length - 1]}</kbd> to choose ·{" "}
                </>
              )}
              {hasTextarea ? (
                <>
                  <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Enter</kbd> to continue
                </>
              ) : (
                <>
                  <kbd>Enter</kbd> to continue
                </>
              )}
            </p>
          </form>
        ) : (
          <div className="gw-flow__step">
            <p className="gw-flow__kicker">Last look</p>
            <h3 className="gw-flow__title" tabIndex={-1} ref={headingRef}>
              Check it over, then send it.
            </h3>
            <p className="gw-flow__help">This is exactly what lands with us. Change anything that isn't right.</p>

            <div className="gw-flow__review">
              {steps.map((s, i) => {
                const answered = s.fields.map((n) => byName[n]).filter((f) => !isEmptyValue(values[f.name]) && values[f.name] !== false);
                return (
                  <section className="gw-flow__rblock" key={s.id} aria-labelledby={`${uid}-r-${s.id}`} style={{ "--i": i }}>
                    <div className="gw-flow__rhead">
                      <span className="gw-flow__rnum" aria-hidden="true">
                        {i + 1}
                      </span>
                      <h4 id={`${uid}-r-${s.id}`}>{s.short}</h4>
                      <button type="button" className="gw-flow__textbtn" onClick={() => jump(i)}>
                        Change<span className="gw-sr-only"> {s.short}</span>
                      </button>
                    </div>
                    {answered.length ? (
                      <dl className="gw-flow__pairs">
                        {answered.map((f) => (
                          <div key={f.name}>
                            <dt>{f.type === "checkbox" ? "Confirmed" : f.label}</dt>
                            <dd>{f.type === "checkbox" ? f.label : displayValue(f, values[f.name])}</dd>
                          </div>
                        ))}
                      </dl>
                    ) : (
                      <p className="gw-flow__skipped">Skipped</p>
                    )}
                  </section>
                );
              })}
            </div>

            {status === "failed" && (
              <div className="gw-alert gw-mt-3" role="alert">
                <strong>That didn't send.</strong>
                <span>{failure}</span>
                <span>Nothing you've typed is lost. Email it to us instead and everything above comes with it.</span>
                <div className="gw-actions">
                  <Button href={mailtoFallback(form, values)} variant="secondary" size="sm">
                    Email it to us instead
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={send}>
                    Try again
                  </Button>
                </div>
              </div>
            )}

            <div className="gw-flow__nav">
              <button type="button" className="gw-flow__back" onClick={() => goTo(review - 1, "back")}>
                ← Back
              </button>
              <Button type="button" size="lg" arrow onClick={send} disabled={status === "sending"}>
                {status === "sending" ? "Sending…" : form.submitLabel}
              </Button>
            </div>
            <p className="gw-form__fine gw-mt-2">
              Sent to Goodwork only. We reply from a person. See the{" "}
              <a className="gw-link" href="/legal/privacy">
                privacy policy
              </a>
              .
            </p>
          </div>
        )}
      </div>

      {/* Honeypot: off-screen rather than display:none, since some bots skip what's obviously hidden. */}
      <div className="gw-honeypot" aria-hidden="true">
        <label htmlFor={`${uid}-hp`}>Website URL</label>
        <input id={`${uid}-hp`} ref={honeypotRef} name="website_url" type="text" tabIndex={-1} autoComplete="off" />
      </div>
    </div>
  );
}

function FlowField({ f, uid, value, error, sole, keyed, onChange, onPick, onRepick, onPointer }) {
  // After a quick pick writes into a textarea, the next focus should carry on
  // typing after it rather than in front of it.
  const picked = useRef(false);
  const id = `${uid}-${f.name}`;
  const errId = `${id}-error`;
  const hintId = f.hint && !sole ? `${id}-hint` : undefined;
  const describedBy = [error ? errId : null, hintId].filter(Boolean).join(" ") || undefined;
  const err = error ? (
    <p className="gw-flow__error" id={errId}>
      {error}
    </p>
  ) : null;
  const hint = hintId ? (
    <span className="gw-flow__fieldhint" id={hintId}>
      {f.hint}
    </span>
  ) : null;
  const optional = !f.required && <span className="gw-flow__optional">Optional</span>;

  if (OPTION_TYPES.has(f.type)) {
    const multi = f.type === "checkbox-group";
    const chips = f.ui === "chips";
    const chosen = multi ? value || [] : value;
    return (
      <fieldset className="gw-flow__group" aria-describedby={describedBy} aria-invalid={error ? "true" : undefined}>
        <legend className={sole ? "gw-sr-only" : "gw-flow__label"}>
          {f.label}
          {!sole && optional}
        </legend>
        {hint}
        <div className={chips ? "gw-flow__chips" : "gw-flow__opts"}>
          {f.options.map((o, i) => {
            const on = multi ? chosen.includes(o.value) : chosen === o.value;
            return (
              <label
                key={o.value}
                className={`${chips ? "gw-flow__chip" : "gw-flow__opt"}${on ? " is-on" : ""}`}
                onPointerDown={onPointer}
                onClick={() => {
                  if (!multi && on) onRepick();
                }}
              >
                <input className="gw-flow__native" type={multi ? "checkbox" : "radio"} name={f.name} value={o.value} checked={on} onChange={() => onPick(o.value)} />
                {keyed && (
                  <span className="gw-flow__key" aria-hidden="true">
                    {LETTERS[i]}
                  </span>
                )}
                <span className="gw-flow__optlabel">{o.label}</span>
                {!chips && <Tick className="gw-flow__check" />}
              </label>
            );
          })}
        </div>
        {multi && <p className="gw-flow__tally">{chosen.length ? `${chosen.length} selected` : f.required ? "Pick at least one" : "Pick any that apply, or skip"}</p>}
        {err}
      </fieldset>
    );
  }

  if (f.type === "checkbox") {
    return (
      <div className="gw-flow__field">
        <label className={`gw-flow__consent${value === true ? " is-on" : ""}`} htmlFor={id}>
          <input
            className="gw-flow__native"
            id={id}
            name={f.name}
            type="checkbox"
            checked={value === true}
            onChange={(e) => onChange(e.target.checked)}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={error ? errId : undefined}
            aria-required={f.required || undefined}
          />
          <span className="gw-flow__box" aria-hidden="true">
            <Tick />
          </span>
          <span>{f.label}</span>
        </label>
        {err}
      </div>
    );
  }

  const common = {
    id,
    name: f.name,
    value,
    placeholder: f.placeholder,
    "aria-invalid": error ? "true" : undefined,
    "aria-describedby": describedBy,
    "aria-required": f.required || undefined,
  };
  const label = (
    <label className={sole ? "gw-sr-only" : "gw-flow__label"} htmlFor={id}>
      {f.label}
      {!sole && optional}
    </label>
  );

  if (f.type === "textarea") {
    return (
      <div className="gw-flow__field">
        {label}
        {hint}
        {f.stages && (
          <StageBuilder
            f={f}
            value={value}
            onChange={(v) => {
              picked.current = true;
              onChange(v);
            }}
          />
        )}
        <GrowingTextarea
          className="gw-flow__input gw-flow__input--area"
          rows={f.stages ? 2 : f.rows || 3}
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => {
            if (!picked.current) return;
            picked.current = false;
            const end = e.currentTarget.value.length;
            e.currentTarget.setSelectionRange(end, end);
          }}
          {...common}
        />
        {f.tokens && (
          <QuickPicks
            label={`Quick picks for ${f.label.toLowerCase()}`}
            items={f.tokens}
            on={(t) => splitItems(value).some((x) => same(x, t))}
            onToggle={(t) => {
              picked.current = true;
              onChange(toggleItem(value, t));
            }}
          />
        )}
        {err}
      </div>
    );
  }

  const ok = !error && !isEmptyValue(value) && Object.keys(validate([f], { [f.name]: value })).length === 0;
  const inputMode = f.type === "tel" ? "tel" : f.type === "email" ? "email" : f.type === "url" ? "url" : undefined;
  return (
    <div className="gw-flow__field">
      {label}
      {hint}
      <div className="gw-flow__inputwrap">
        <input
          className="gw-flow__input"
          type={f.type === "url" ? "text" : f.type}
          inputMode={inputMode}
          autoComplete={f.autoComplete}
          onChange={(e) => onChange(e.target.value)}
          {...common}
        />
        {ok && <Tick className="gw-flow__ok" />}
      </div>
      {err}
    </div>
  );
}

/** A textarea that grows with what's typed, up to a point, instead of scrolling a tiny box. */
function GrowingTextarea(props) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight + 2, 360)}px`;
  }, [props.value]);
  return <textarea ref={ref} {...props} />;
}

function QuickPicks({ label, items, on, onToggle }) {
  return (
    <div className="gw-flow__picks" role="group" aria-label={label}>
      {items.map((t) => {
        const pressed = on(t);
        return (
          <button type="button" key={t} className={`gw-flow__pick${pressed ? " is-on" : ""}`} aria-pressed={pressed} onClick={() => onToggle(t)}>
            <span className="gw-flow__pick-sign" aria-hidden="true">
              {pressed ? "✓" : "+"}
            </span>
            {t}
          </button>
        );
      })}
    </div>
  );
}

/** Pipeline stages as taps, with the result drawn as the pipeline it describes. */
function StageBuilder({ f, value, onChange }) {
  const stages = splitStages(value);
  const has = (s) => stages.some((x) => same(x, s));
  const toggle = (s) => onChange((has(s) ? stages.filter((x) => !same(x, s)) : [...stages, s]).join(" → "));
  return (
    <div className="gw-flow__stages">
      <QuickPicks label="Common stages" items={f.stages} on={has} onToggle={toggle} />
      <ol className="gw-flow__pipeline" aria-label="Your pipeline, in order">
        {stages.length ? (
          stages.map((s, i) => (
            <li key={`${s}-${i}`}>
              <span className="gw-flow__stage-n" aria-hidden="true">
                {i + 1}
              </span>
              {s}
            </li>
          ))
        ) : (
          <li className="gw-flow__pipeline-empty">Tap stages above, or type them below. They line up here in order.</li>
        )}
      </ol>
    </div>
  );
}

function Tick({ className }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M3.5 8.5l3 3 6-7" />
    </svg>
  );
}

function Done({ form, values, rootRef, headingRef, reduced }) {
  const gradient = `gw-flow-tick-${useId().replace(/:/g, "")}`;
  return (
    <div className="gw-flow gw-flow--done" role="status" ref={rootRef}>
      {!reduced && (
        <div className="gw-flow__burst" aria-hidden="true">
          {BURST.map(([x, y, r, d, c], i) => (
            <i key={i} style={{ "--x": `${x}px`, "--y": `${y}px`, "--r": `${r}deg`, "--d": `${d}ms`, "--c": BURST_COLOURS[c] }} />
          ))}
        </div>
      )}
      <div className="gw-flow__done-head">
        <svg className="gw-flow__done-tick" viewBox="0 0 52 52" fill="none" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id={gradient} x1="0" y1="0" x2="52" y2="52" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#3366ff" />
              <stop offset="0.4" stopColor="#7a5cff" />
              <stop offset="0.75" stopColor="#ff2db3" />
              <stop offset="1" stopColor="#ff6b5e" />
            </linearGradient>
          </defs>
          <circle cx="26" cy="26" r="24" stroke={`url(#${gradient})`} />
          <path d="M15 27l7 7 15-16" stroke="currentColor" />
        </svg>
        <Stamp size={88} />
      </div>
      <p className="gw-flow__kicker">Sent</p>
      <h3 className="gw-flow__title" tabIndex={-1} ref={headingRef}>
        {resolveText(form.doneTitle, values) || form.successTitle}
      </h3>
      {form.next ? (
        <ol className="gw-flow__next">
          {form.next.map((t, i) => (
            <li key={t}>
              <span aria-hidden="true">{i + 1}</span>
              {t}
            </li>
          ))}
        </ol>
      ) : (
        <p className="gw-flow__help">{form.successCopy}</p>
      )}
      <p className="gw-small gw-muted gw-mt-3">
        If it's urgent,{" "}
        <a className="gw-link" href={`mailto:${CONTACT_EMAIL}`}>
          {CONTACT_EMAIL}
        </a>{" "}
        reaches us directly.
      </p>
    </div>
  );
}
