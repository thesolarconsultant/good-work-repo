import { useEffect, useMemo, useRef, useState } from "react";
import { SERVICES, CATEGORIES, BILLING_LABELS } from "../data/services";
import { QUESTIONS, recommend, validateScope } from "../data/scope";
import { answerSummary, asPlainText, mailtoFallback, CONTACT_EMAIL } from "../lib/enquiry";
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

// The whole journey in order. Everything — progress, next, back, and the
// review screen's "change this" links — is derived from this one array, so
// adding a step is a single edit rather than four places to keep in sync.
// "sent" is terminal and deliberately outside it.
const FLOW = ["intro", ...QUESTIONS.map((_, i) => i), "results", "you", "reach", "extra", "review"];

export default function ScopeBuilder() {
  const reduced = usePrefersReducedMotion();

  const [step, setStep] = useState("intro");
  const [answers, setAnswers] = useState({});
  // null until the results screen builds it, then the client owns it — they
  // can add and remove, and we must not quietly overwrite their edits when a
  // re-render recomputes the recommendation.
  const [chosen, setChosen] = useState(null);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [contact, setContact] = useState({ name: "", business: "", phone: "", email: "", message: "" });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | sending | failed
  const [failure, setFailure] = useState(null);

  const headingRef = useRef(null);
  const panelRef = useRef(null);
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

  // Moving between steps replaces the whole panel, so focus has to be sent
  // somewhere deliberate — otherwise a keyboard or screen reader user is left
  // on a button that no longer exists and gets dropped to the top of the page.
  // Text steps focus the input, since typing is the next thing you'd do;
  // everything else focuses the heading so the question is read first.
  useEffect(() => {
    if (!hasMoved.current) {
      hasMoved.current = true;
      return;
    }
    const input = panelRef.current?.querySelector("input:not([tabindex='-1']), textarea");
    if (input && ["you", "reach", "extra"].includes(step)) input.focus();
    else headingRef.current?.focus();
  }, [step]);

  const recommendation = useMemo(() => recommend(answers), [answers]);
  const selectedIds = chosen ?? recommendation.serviceIds;
  const payload = { contact, answers, serviceIds: selectedIds };

  const flowIndex = FLOW.indexOf(step);
  const progress = step === "sent" ? 100 : Math.round(((flowIndex + 1) / FLOW.length) * 100);
  const questionIndex = typeof step === "number" ? step : null;
  const question = questionIndex == null ? null : QUESTIONS[questionIndex];

  function go(delta) {
    const next = FLOW[flowIndex + delta];
    if (next !== undefined) setStep(next);
  }

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

  function toggleService(id) {
    setChosen((prev) => {
      const next = new Set(prev ?? recommendation.serviceIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return [...next];
    });
  }

  // Validation is per step, so a mistake is caught on the screen that caused
  // it rather than all at once at the end.
  function validateStep(which) {
    const next = {};
    if (which === "you" && !contact.name.trim()) {
      next.name = "We'll need a name to put to it.";
    }
    if (which === "reach") {
      if (!contact.phone.trim()) next.phone = "A number, so we can actually talk it through.";
      else if (!PHONE_RE.test(contact.phone.trim())) next.phone = "That doesn't look like a phone number.";
      if (!contact.email.trim()) next.email = "We'll need an email to send the scope to.";
      else if (!EMAIL_RE.test(contact.email.trim())) next.email = "That doesn't look like an email address.";
    }
    return next;
  }

  // Every detail step is a real <form>, so Enter advances the way it does in
  // any other form rather than doing nothing or reloading the page.
  function advanceFrom(which) {
    return (event) => {
      event.preventDefault();
      const found = validateStep(which);
      setErrors(found);
      if (Object.keys(found).length) {
        panelRef.current?.querySelector(`[name="${Object.keys(found)[0]}"]`)?.focus();
        return;
      }
      go(1);
    };
  }

  async function send() {
    setStatus("sending");
    setFailure(null);
    try {
      const response = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact: {
            name: contact.name.trim(),
            business: contact.business.trim(),
            phone: contact.phone.trim(),
            email: contact.email.trim(),
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
      setStatus("idle");
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

  const announcement =
    step === "intro" ? "Scope builder, ready to start"
      : typeof step === "number" ? `Question ${step + 1} of ${QUESTIONS.length}: ${QUESTIONS[step].question}`
        : step === "results" ? `Your recommendation: ${selectedIds.length} services`
          : step === "you" ? "Your name"
            : step === "reach" ? "How we reach you"
              : step === "extra" ? "Anything else"
                : step === "review" ? "Review everything before sending"
                  : "Enquiry sent";

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
                : `Step ${flowIndex + 1} of ${FLOW.length}`}
            </p>
          </div>
        )}

        {/* One live region for the whole flow, so a screen reader is told the
            step changed without every option re-announcing itself. */}
        <p className="gw-sr-only" aria-live="polite">{announcement}</p>

        <div
          className={`gw-scope__panel${reduced ? "" : " gw-scope__panel--in"}`}
          key={String(step)}
          ref={panelRef}
        >
          {step === "intro" && (
            <div className="gw-scope__intro">
              <h2 className="gw-h2" tabIndex={-1} ref={headingRef}>
                Not sure what you need? Let's work it out.
              </h2>
              <p className="gw-body-large gw-max-copy gw-text-muted gw-stack-md">
                Six questions about the business — what's not working, what you've already got,
                and who keeps it running afterwards. At the end you'll get a scope you can edit,
                check over, and send straight to us.
              </p>
              <p className="gw-body gw-max-copy gw-text-muted gw-stack-sm">
                No prices are quoted here and nothing is committed. We come back with a fixed
                price for exactly what you asked for.
              </p>
              <div className="gw-actions gw-stack-lg">
                <button type="button" className="gw-button" onClick={() => go(1)}>
                  <span className="gw-button__label">Start</span>
                  <span className="gw-button__arrow" aria-hidden="true">→</span>
                </button>
                <button type="button" className="gw-button gw-button--outline" onClick={() => setStep("results")}>
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
                  const active = question.multi ? (current || []).includes(o.id) : current === o.id;
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

              <Nav onBack={() => go(-1)} nextLabel={questionIndex === QUESTIONS.length - 1 ? "See what you need" : "Next"} onNext={() => go(1)} nextDisabled={!answered(question)} />
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
                    const items = SERVICES.filter((s) => s.category === cat && selectedIds.includes(s.id));
                    if (!items.length) return null;
                    return (
                      <div key={cat} className="gw-scope__group">
                        <p className="gw-label">{cat}</p>
                        {items.map((s) => (
                          <label key={s.id} className="gw-opt gw-opt--active gw-opt--compact">
                            <input type="checkbox" checked onChange={() => toggleService(s.id)} className="gw-opt__input" />
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
                      const items = SERVICES.filter((s) => s.category === cat && !selectedIds.includes(s.id));
                      if (!items.length) return null;
                      return (
                        <div key={cat} className="gw-scope__group">
                          <p className="gw-label">{cat}</p>
                          {items.map((s) => (
                            <label key={s.id} className="gw-opt gw-opt--compact">
                              <input type="checkbox" checked={false} onChange={() => toggleService(s.id)} className="gw-opt__input" />
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

              <Nav
                onBack={() => setStep(QUESTIONS.length - 1)}
                backLabel="← Change my answers"
                nextLabel="Add your details"
                onNext={() => go(1)}
                nextDisabled={selectedIds.length === 0}
              />
            </div>
          )}

          {step === "you" && (
            <form className="gw-scope__ask" onSubmit={advanceFrom("you")} noValidate>
              <p className="gw-label">Your details</p>
              <h2 className="gw-h2 gw-stack-sm" tabIndex={-1} ref={headingRef}>
                Who are we speaking to?
              </h2>
              <p className="gw-body gw-text-muted gw-max-copy gw-stack-sm">
                So the reply comes back to a person, not a company inbox.
              </p>
              <div className="gw-scope__fields gw-stack-md">
                <BigField
                  id="scope-name" name="name" label="Your name" required autoComplete="name"
                  value={contact.name} error={errors.name}
                  onChange={(v) => setContact((c) => ({ ...c, name: v }))}
                />
                <BigField
                  id="scope-business" name="business" label="Business name" hint="Optional"
                  autoComplete="organization" value={contact.business}
                  onChange={(v) => setContact((c) => ({ ...c, business: v }))}
                />
              </div>
              <Nav onBack={() => go(-1)} nextLabel="Next" submit />
            </form>
          )}

          {step === "reach" && (
            <form className="gw-scope__ask" onSubmit={advanceFrom("reach")} noValidate>
              <p className="gw-label">Your details</p>
              <h2 className="gw-h2 gw-stack-sm" tabIndex={-1} ref={headingRef}>
                How do we reach you?
              </h2>
              <p className="gw-body gw-text-muted gw-max-copy gw-stack-sm">
                We'll email the scope over and ring if anything needs a conversation. Both, so
                neither is a dead end.
              </p>
              <div className="gw-scope__fields gw-stack-md">
                <BigField
                  id="scope-phone" name="phone" label="Phone number" required type="tel"
                  autoComplete="tel" inputMode="tel" value={contact.phone} error={errors.phone}
                  onChange={(v) => setContact((c) => ({ ...c, phone: v }))}
                />
                <BigField
                  id="scope-email" name="email" label="Email" required type="email"
                  autoComplete="email" inputMode="email" value={contact.email} error={errors.email}
                  onChange={(v) => setContact((c) => ({ ...c, email: v }))}
                />
              </div>
              <Nav onBack={() => go(-1)} nextLabel="Next" submit />
            </form>
          )}

          {step === "extra" && (
            <form className="gw-scope__ask" onSubmit={advanceFrom("extra")} noValidate>
              <p className="gw-label">Your details</p>
              <h2 className="gw-h2 gw-stack-sm" tabIndex={-1} ref={headingRef}>
                Anything else we should know?
              </h2>
              <p className="gw-body gw-text-muted gw-max-copy gw-stack-sm">
                Deadlines, budget range, something that's already been tried and didn't work.
                Skip it if there's nothing.
              </p>
              {/* Not display:none — some bots skip anything hidden that way. */}
              <div className="gw-honeypot" aria-hidden="true">
                <label htmlFor="company-website">Company website</label>
                <input id="company-website" name="company-website" tabIndex={-1} autoComplete="off" />
              </div>
              <div className="gw-field gw-stack-md">
                <label htmlFor="scope-message">In your own words</label>
                <textarea
                  id="scope-message" name="message" rows={5} value={contact.message}
                  onChange={(e) => setContact((c) => ({ ...c, message: e.target.value }))}
                />
              </div>
              <Nav onBack={() => go(-1)} nextLabel={contact.message.trim() ? "Next" : "Skip"} submit />
            </form>
          )}

          {step === "review" && (
            <div className="gw-scope__review">
              <p className="gw-label">Last look</p>
              <h2 className="gw-h2 gw-stack-sm" tabIndex={-1} ref={headingRef}>
                Check it over, then send it
              </h2>
              <p className="gw-body gw-text-muted gw-max-copy gw-stack-sm">
                This is exactly what lands with us. Change anything that isn't right.
              </p>

              <div className="gw-review gw-stack-md">
                <ReviewBlock title="Your details" onChange={() => setStep("you")}>
                  <dl className="gw-review__pairs">
                    <dt>Name</dt><dd>{contact.name}</dd>
                    {contact.business && (<><dt>Business</dt><dd>{contact.business}</dd></>)}
                    <dt>Phone</dt><dd>{contact.phone}</dd>
                    <dt>Email</dt><dd>{contact.email}</dd>
                  </dl>
                </ReviewBlock>

                <ReviewBlock
                  title={`What you want quoting (${selectedIds.length})`}
                  onChange={() => setStep("results")}
                >
                  {selectedIds.length === 0 ? (
                    <p className="gw-review__empty">Nothing selected.</p>
                  ) : (
                    CATEGORIES.map((cat) => {
                      const items = SERVICES.filter((s) => s.category === cat && selectedIds.includes(s.id));
                      if (!items.length) return null;
                      return (
                        <div key={cat} className="gw-review__group">
                          <p className="gw-label">{cat}</p>
                          <ul className="gw-review__list">
                            {items.map((s) => (
                              <li key={s.id}>
                                <span>{s.name}</span>
                                <span className="gw-opt__billing">{BILLING_LABELS[s.billing]}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })
                  )}
                </ReviewBlock>

                {answerSummary(answers).length > 0 && (
                  <ReviewBlock title="What you told us" onChange={() => setStep(0)}>
                    <dl className="gw-review__pairs">
                      {answerSummary(answers).map(({ question: q, answers: given }) => (
                        <div key={q} className="gw-review__qa">
                          <dt>{q}</dt>
                          <dd>{given.join(" · ")}</dd>
                        </div>
                      ))}
                    </dl>
                  </ReviewBlock>
                )}

                {contact.message.trim() && (
                  <ReviewBlock title="Anything else" onChange={() => setStep("extra")}>
                    <p className="gw-review__message">{contact.message.trim()}</p>
                  </ReviewBlock>
                )}
              </div>

              {status === "failed" && (
                <div className="gw-scope__error gw-stack-md" role="alert">
                  <strong>That didn't send.</strong>
                  <span>{failure}</span>
                  <span>
                    Nothing you've entered is lost. Send it by email instead and everything on
                    this screen comes with it:
                  </span>
                  <a className="gw-button gw-button--outline" href={mailtoFallback(payload)}>
                    <span className="gw-button__label">Email it to us instead</span>
                  </a>
                </div>
              )}

              <Nav
                onBack={() => go(-1)}
                nextLabel={status === "sending" ? "Sending…" : "Confirm and send"}
                onNext={send}
                nextDisabled={status === "sending"}
              />
            </div>
          )}

          {step === "sent" && (
            <div className="gw-scope__sent">
              <p className="gw-label">Sent</p>
              <h2 className="gw-h2 gw-stack-sm" tabIndex={-1} ref={headingRef}>
                Got it — that's with us<span className="gw-dot" />
              </h2>
              <p className="gw-body-large gw-max-copy gw-text-muted gw-stack-md">
                It's gone straight into our system, so it won't sit in an inbox waiting to be
                noticed. We'll come back with a scope and a fixed price, usually the same working
                day. If it's urgent, {CONTACT_EMAIL} reaches us directly.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/** The same back/next pair on every step, so the flow never moves under you. */
function Nav({ onBack, backLabel = "← Back", nextLabel, onNext, nextDisabled, submit }) {
  return (
    <div className="gw-scope__nav">
      <button type="button" className="gw-scope__back" onClick={onBack}>{backLabel}</button>
      <button
        type={submit ? "submit" : "button"}
        className="gw-button"
        disabled={nextDisabled}
        onClick={submit ? undefined : onNext}
      >
        <span className="gw-button__label">{nextLabel}</span>
        <span className="gw-button__arrow" aria-hidden="true">→</span>
      </button>
    </div>
  );
}

function ReviewBlock({ title, onChange, children }) {
  return (
    <div className="gw-review__block">
      <div className="gw-review__head">
        <h3 className="gw-review__title">{title}</h3>
        <button type="button" className="gw-review__change" onClick={onChange}>
          Change<span className="gw-sr-only"> {title}</span>
        </button>
      </div>
      {children}
    </div>
  );
}

function BigField({ id, name, label, hint, type = "text", required, value, error, onChange, autoComplete, inputMode }) {
  return (
    <div className="gw-field gw-field--big">
      <label htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
        {hint && <span className="gw-field__hint">{hint}</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-required={required || undefined}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <p className="gw-field__error" id={`${id}-error`}>{error}</p>}
    </div>
  );
}
