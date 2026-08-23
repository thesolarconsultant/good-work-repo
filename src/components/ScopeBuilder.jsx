import { useEffect, useMemo, useRef, useState } from "react";
import { SERVICES, CATEGORIES, BILLING_LABELS } from "../data/services";
import { QUESTIONS, recommend, validateScope } from "../data/scope";
import { asPlainText, mailtoFallback, CONTACT_EMAIL } from "../lib/enquiry";
import { usePrefersReducedMotion } from "../lib/motion";

const STORAGE_KEY = "gw:scope";

// A typo in the question -> service mapping would mean a service that can
// never be recommended and nobody would ever notice. Shout about it in dev;
// in production this is stripped out entirely.
if (import.meta.env.DEV) {
  const bad = validateScope();
  if (bad.length) console.error("scope.js references unknown service ids:", bad);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Deliberately loose: UK landlines, mobiles, +44, spaces, brackets and dashes
// are all normal, and rejecting a real number is far worse than accepting an
// odd one. Just enough digits to be a phone number at all.
const PHONE_RE = /^[+()\d][\d\s()+.-]{7,}$/;

export default function ScopeBuilder() {
  const reduced = usePrefersReducedMotion();

  // "intro" | 0..n-1 | "results" | "details" | "sent"
  const [step, setStep] = useState("intro");
  const [answers, setAnswers] = useState({});
  // null until the results screen builds it, then the client owns it — they
  // can add and remove, and we must not quietly overwrite their edits when a
  // re-render recomputes the recommendation.
  const [chosen, setChosen] = useState(null);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [contact, setContact] = useState({ name: "", email: "", phone: "", business: "", message: "" });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | sending | sent | failed
  const [failure, setFailure] = useState(null);

  const headingRef = useRef(null);
  const formRef = useRef(null);
  const hasMoved = useRef(false);

  // Ten minutes of answers shouldn't die to an accidental refresh.
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
      if (saved?.answers) {
        setAnswers(saved.answers);
        if (saved.chosen) setChosen(saved.chosen);
        if (saved.contact) setContact((c) => ({ ...c, ...saved.contact }));
      }
    } catch {
      // Storage disabled. The builder still works, it just won't remember.
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, chosen, contact }));
    } catch {
      // As above.
    }
  }, [answers, chosen, contact]);

  // Moving between steps replaces the whole panel, so focus has to be sent to
  // the new heading — otherwise a keyboard or screen reader user is left on a
  // button that no longer exists and gets dropped back to the top of the page.
  useEffect(() => {
    if (!hasMoved.current) {
      hasMoved.current = true;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  const recommendation = useMemo(() => recommend(answers), [answers]);

  const questionIndex = typeof step === "number" ? step : null;
  const question = questionIndex == null ? null : QUESTIONS[questionIndex];
  const totalSteps = QUESTIONS.length + 2; // questions + results + details
  const stepNumber =
    step === "intro" ? 0
      : typeof step === "number" ? step + 1
        : step === "results" ? QUESTIONS.length + 1
          : QUESTIONS.length + 2;
  const progress = Math.round((stepNumber / totalSteps) * 100);

  function answered(q) {
    const a = answers[q.id];
    return Array.isArray(a) ? a.length > 0 : a != null;
  }

  function choose(q, optionId) {
    setAnswers((prev) => {
      if (!q.multi) return { ...prev, [q.id]: optionId };
      const current = new Set(prev[q.id] || []);
      if (current.has(optionId)) current.delete(optionId);
      else current.add(optionId);
      return { ...prev, [q.id]: [...current] };
    });
  }

  function goToResults() {
    // Seed the editable list from the recommendation, but only the first time
    // — coming back from the contact step must not wipe their changes.
    setChosen((prev) => prev ?? recommendation.serviceIds);
    setStep("results");
  }

  function toggleService(id) {
    setChosen((prev) => {
      const next = new Set(prev ?? recommendation.serviceIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return [...next];
    });
  }

  const selectedIds = chosen ?? recommendation.serviceIds;
  const payload = { contact, answers, serviceIds: selectedIds };

  function validate() {
    const next = {};
    if (!contact.name.trim()) next.name = "We'll need a name to put to it.";
    if (!contact.email.trim()) next.email = "We'll need an email to reply to.";
    else if (!EMAIL_RE.test(contact.email.trim())) next.email = "That doesn't look like an email address.";
    if (!contact.phone.trim()) next.phone = "A number, so we can actually talk it through.";
    else if (!PHONE_RE.test(contact.phone.trim())) next.phone = "That doesn't look like a phone number.";
    return next;
  }

  async function submit(event) {
    event.preventDefault();
    // Bots fill in everything, including the field nobody can see.
    if (new FormData(event.currentTarget).get("company-website")) return;

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) {
      formRef.current?.querySelector(`[name="${Object.keys(found)[0]}"]`)?.focus();
      return;
    }

    setStatus("sending");
    setFailure(null);
    try {
      const response = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact: {
            name: contact.name.trim(),
            email: contact.email.trim(),
            phone: contact.phone.trim(),
            business: contact.business.trim(),
            message: contact.message.trim(),
          },
          answers,
          serviceIds: selectedIds,
          text: asPlainText(payload),
        }),
      });

      if (!response.ok) {
        // Anything other than a 2xx means it did not arrive. Saying "thanks,
        // we'll be in touch" here would be a lie that costs a real lead.
        const detail = await response.json().catch(() => ({}));
        throw new Error(
          detail.error ||
            (response.status === 404
              ? "The enquiry endpoint isn't deployed yet."
              : `The server returned ${response.status}.`),
        );
      }
      setStatus("sent");
      setStep("sent");
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        // Nothing to clear.
      }
    } catch (error) {
      setStatus("failed");
      setFailure(error.message || "Something went wrong sending it.");
    }
  }

  const panelClass = `gw-scope__panel${reduced ? "" : " gw-scope__panel--in"}`;

  return (
    <section className="gw-section gw-scope" id="scope">
      <div className="gw-container">
        {step !== "sent" && (
          <div className="gw-scope__head">
            <p className="gw-label">Build your scope</p>
            <div
              className="gw-scope__progress"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progress through the scope builder"
            >
              <span style={{ width: `${progress}%` }} />
            </div>
            <p className="gw-scope__count">
              {step === "intro"
                ? `${QUESTIONS.length} questions, about two minutes`
                : `Step ${stepNumber} of ${totalSteps}`}
            </p>
          </div>
        )}

        {/* One live region for the whole flow, so a screen reader is told the
            step changed without every option re-announcing itself. */}
        <p className="gw-sr-only" aria-live="polite">
          {step === "intro"
            ? "Scope builder, ready to start"
            : typeof step === "number"
              ? `Question ${step + 1} of ${QUESTIONS.length}: ${QUESTIONS[step].question}`
              : step === "results"
                ? `Your recommendation: ${selectedIds.length} services`
                : step === "details"
                  ? "Your details"
                  : "Enquiry sent"}
        </p>

        <div className={panelClass} key={String(step)}>
          {step === "intro" && (
            <div className="gw-scope__intro">
              <h2 className="gw-h2" tabIndex={-1} ref={headingRef}>
                Not sure what you need? Let's work it out.
              </h2>
              <p className="gw-body-large gw-max-copy gw-text-muted gw-stack-md">
                Six questions about the business — what's not working, what you've already got,
                and who keeps it running afterwards. At the end you'll get a scope you can edit,
                and you can send it straight to us.
              </p>
              <p className="gw-body gw-max-copy gw-text-muted gw-stack-sm">
                No prices are quoted here and nothing is committed. We come back with a fixed
                price for exactly what you asked for.
              </p>
              <div className="gw-actions gw-stack-lg">
                <button type="button" className="gw-button" onClick={() => setStep(0)}>
                  <span className="gw-button__label">Start</span>
                  <span className="gw-button__arrow" aria-hidden="true">→</span>
                </button>
                <button type="button" className="gw-button gw-button--outline" onClick={goToResults}>
                  <span className="gw-button__label">Skip — just show me everything</span>
                </button>
              </div>
            </div>
          )}

          {question && (
            <fieldset className="gw-scope__q">
              <legend className="gw-sr-only">{question.question}</legend>
              <p className="gw-label">{question.kicker}</p>
              <h2 className="gw-h2 gw-stack-sm" tabIndex={-1} ref={headingRef}>
                {question.question}
              </h2>
              <p className="gw-body gw-text-muted gw-max-copy gw-stack-sm">{question.help}</p>

              <div className="gw-scope__options gw-stack-md">
                {question.options.map((o) => {
                  const current = answers[question.id];
                  const active = question.multi
                    ? (current || []).includes(o.id)
                    : current === o.id;
                  return (
                    <label key={o.id} className={`gw-opt${active ? " gw-opt--active" : ""}`}>
                      <input
                        type={question.multi ? "checkbox" : "radio"}
                        name={question.id}
                        value={o.id}
                        checked={active}
                        onChange={() => choose(question, o.id)}
                        className="gw-opt__input"
                      />
                      <span className="gw-opt__body">
                        <span className="gw-opt__label">{o.label}</span>
                        <span className="gw-opt__desc">{o.desc}</span>
                      </span>
                      <span className="gw-opt__tick" aria-hidden="true" />
                    </label>
                  );
                })}
              </div>

              <div className="gw-scope__nav">
                <button
                  type="button"
                  className="gw-scope__back"
                  onClick={() => setStep(questionIndex === 0 ? "intro" : questionIndex - 1)}
                >
                  ← Back
                </button>
                <button
                  type="button"
                  className="gw-button"
                  disabled={!answered(question)}
                  onClick={() =>
                    questionIndex === QUESTIONS.length - 1 ? goToResults() : setStep(questionIndex + 1)
                  }
                >
                  <span className="gw-button__label">
                    {questionIndex === QUESTIONS.length - 1 ? "See what you need" : "Next"}
                  </span>
                  <span className="gw-button__arrow" aria-hidden="true">→</span>
                </button>
              </div>
            </fieldset>
          )}

          {step === "results" && (
            <div className="gw-scope__results">
              <p className="gw-label">Your scope</p>
              <h2 className="gw-h2 gw-stack-sm" tabIndex={-1} ref={headingRef}>
                {selectedIds.length === 0
                  ? "Nothing selected yet"
                  : `Here's what we'd suggest — ${selectedIds.length} thing${selectedIds.length === 1 ? "" : "s"}`}
              </h2>
              <p className="gw-body gw-max-copy gw-text-muted gw-stack-sm">
                Built from what you told us. Untick anything you don't want and add anything we've
                missed — this is your list, not ours.
              </p>

              {selectedIds.length > 0 && (
                <div className="gw-scope__groups gw-stack-md">
                  {CATEGORIES.map((cat) => {
                    const items = SERVICES.filter(
                      (s) => s.category === cat && selectedIds.includes(s.id),
                    );
                    if (!items.length) return null;
                    return (
                      <div key={cat} className="gw-scope__group">
                        <p className="gw-label">{cat}</p>
                        {items.map((s) => (
                          <label key={s.id} className="gw-opt gw-opt--active gw-opt--compact">
                            <input
                              type="checkbox"
                              checked
                              onChange={() => toggleService(s.id)}
                              className="gw-opt__input"
                            />
                            <span className="gw-opt__body">
                              <span className="gw-opt__label">{s.name}</span>
                              <span className="gw-opt__desc">{s.note}</span>
                              {recommendation.reasons[s.id]?.length ? (
                                <span className="gw-scope__why">
                                  Because you said: {recommendation.reasons[s.id].join(" · ")}
                                </span>
                              ) : null}
                            </span>
                            <span className="gw-opt__billing">{BILLING_LABELS[s.billing]}</span>
                          </label>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="gw-scope__browse gw-stack-md">
                <button
                  type="button"
                  className="gw-scope__browse-toggle"
                  aria-expanded={browseOpen}
                  onClick={() => setBrowseOpen((o) => !o)}
                >
                  {browseOpen ? "Hide" : "Add"} anything else
                  <span aria-hidden="true">{browseOpen ? " ↑" : " ↓"}</span>
                </button>
                {browseOpen && (
                  <div className="gw-scope__groups">
                    {CATEGORIES.map((cat) => {
                      const items = SERVICES.filter(
                        (s) => s.category === cat && !selectedIds.includes(s.id),
                      );
                      if (!items.length) return null;
                      return (
                        <div key={cat} className="gw-scope__group">
                          <p className="gw-label">{cat}</p>
                          {items.map((s) => (
                            <label key={s.id} className="gw-opt gw-opt--compact">
                              <input
                                type="checkbox"
                                checked={false}
                                onChange={() => toggleService(s.id)}
                                className="gw-opt__input"
                              />
                              <span className="gw-opt__body">
                                <span className="gw-opt__label">{s.name}</span>
                                <span className="gw-opt__desc">{s.note}</span>
                              </span>
                              <span className="gw-opt__billing">{BILLING_LABELS[s.billing]}</span>
                            </label>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="gw-scope__nav">
                <button
                  type="button"
                  className="gw-scope__back"
                  onClick={() => setStep(QUESTIONS.length - 1)}
                >
                  ← Change my answers
                </button>
                <button
                  type="button"
                  className="gw-button"
                  disabled={selectedIds.length === 0}
                  onClick={() => setStep("details")}
                >
                  <span className="gw-button__label">Send this to Good Work</span>
                  <span className="gw-button__arrow" aria-hidden="true">→</span>
                </button>
              </div>
            </div>
          )}

          {step === "details" && (
            <div className="gw-scope__details">
              <p className="gw-label">Nearly there</p>
              <h2 className="gw-h2 gw-stack-sm" tabIndex={-1} ref={headingRef}>
                Where do we send it back?
              </h2>
              <p className="gw-body gw-max-copy gw-text-muted gw-stack-sm">
                We'll come back with a scope and a fixed price for the {selectedIds.length}{" "}
                thing{selectedIds.length === 1 ? "" : "s"} you've picked. Usually same working day.
              </p>

              <form className="gw-scope__form gw-stack-md" onSubmit={submit} ref={formRef} noValidate>
                {/* Not display:none — some bots skip anything hidden that way. */}
                <div className="gw-honeypot" aria-hidden="true">
                  <label htmlFor="company-website">Company website</label>
                  <input id="company-website" name="company-website" tabIndex={-1} autoComplete="off" />
                </div>

                <Field
                  id="scope-name" name="name" label="Your name" required
                  autoComplete="name" value={contact.name} error={errors.name}
                  onChange={(v) => setContact((c) => ({ ...c, name: v }))}
                />
                <Field
                  id="scope-phone" name="phone" label="Phone number" required type="tel"
                  autoComplete="tel" value={contact.phone} error={errors.phone}
                  onChange={(v) => setContact((c) => ({ ...c, phone: v }))}
                />
                <Field
                  id="scope-email" name="email" label="Email" required type="email"
                  autoComplete="email" value={contact.email} error={errors.email}
                  onChange={(v) => setContact((c) => ({ ...c, email: v }))}
                />
                <Field
                  id="scope-business" name="business" label="Business name"
                  autoComplete="organization" value={contact.business}
                  onChange={(v) => setContact((c) => ({ ...c, business: v }))}
                />
                <div className="gw-field">
                  <label htmlFor="scope-message">Anything else we should know?</label>
                  <textarea
                    id="scope-message" name="message" rows={4}
                    value={contact.message}
                    onChange={(e) => setContact((c) => ({ ...c, message: e.target.value }))}
                  />
                </div>

                {status === "failed" && (
                  <div className="gw-scope__error" role="alert">
                    <strong>That didn't send.</strong>
                    <span>{failure}</span>
                    <span>
                      Nothing you've entered is lost. Send it by email instead and everything
                      you've picked comes with it:
                    </span>
                    <a className="gw-button gw-button--outline" href={mailtoFallback(payload)}>
                      <span className="gw-button__label">Email it to us instead</span>
                    </a>
                  </div>
                )}

                <div className="gw-scope__nav">
                  <button type="button" className="gw-scope__back" onClick={() => setStep("results")}>
                    ← Back to the scope
                  </button>
                  <button type="submit" className="gw-button" disabled={status === "sending"}>
                    <span className="gw-button__label">
                      {status === "sending" ? "Sending…" : "Send it"}
                    </span>
                    <span className="gw-button__arrow" aria-hidden="true">→</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === "sent" && (
            <div className="gw-scope__sent">
              <p className="gw-label">Sent</p>
              <h2 className="gw-h2 gw-stack-sm" tabIndex={-1} ref={headingRef}>
                Got it — that's with us<span className="gw-dot" />
              </h2>
              <p className="gw-body-large gw-max-copy gw-text-muted gw-stack-md">
                We'll read it properly and come back with a scope and a fixed price, usually the
                same working day. If it's urgent, {CONTACT_EMAIL} reaches us directly.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Field({ id, name, label, type = "text", required, value, error, onChange, autoComplete }) {
  return (
    <div className="gw-field">
      <label htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        autoComplete={autoComplete}
        required={required}
        aria-required={required || undefined}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && (
        <p className="gw-field__error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
