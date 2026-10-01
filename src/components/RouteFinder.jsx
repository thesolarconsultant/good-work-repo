import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Button from "./Button";
import { OFFER, MANAGED_PLANS, COMBINED } from "../data/offers";
import { gbp } from "../lib/format";
import { track, EVENTS } from "../lib/analytics";

/**
 * "Not sure what you need? Let's work it out." Four questions, one at a time,
 * in the original site's scope-builder style, ending on the offers that fit
 * with the reason for each. Every price and inclusion comes from
 * src/data/offers.js; nothing is quoted that the pricing page doesn't say.
 */
const QUESTIONS = [
  {
    id: "who",
    title: "Who should do the building?",
    type: "single",
    options: [
      { id: "self", label: "I'll build it myself", desc: "Production code, templates and systems you configure." },
      { id: "us", label: "I want it built for me", desc: "Goodwork customises, connects and launches it." },
      { id: "unsure", label: "Not sure yet", desc: "Show me both routes side by side." },
    ],
  },
  {
    id: "need",
    title: "What does the business need?",
    hint: "Pick everything that applies.",
    type: "multi",
    options: [
      { id: "site", label: "A website", desc: "Pages, sections and a template to start from." },
      { id: "agents", label: "WhatsApp or voice agents", desc: "Answer, qualify and book around the clock." },
      { id: "content", label: "Content that keeps going out", desc: "Blogs, social and email from one console." },
      { id: "crm", label: "Somewhere to keep every lead", desc: "A pipeline, follow-ups and next actions." },
      { id: "brand", label: "A brand that holds together", desc: "Positioning, voice and a guideline document." },
    ],
  },
  {
    id: "scale",
    title: "Who is it for?",
    type: "single",
    options: [
      { id: "one", label: "One business", desc: "Our own business, or one client's." },
      { id: "agency", label: "An agency I'm building", desc: "Positioning, offers, sales and delivery, not only a website." },
    ],
  },
  {
    id: "run",
    title: "After launch, who runs it?",
    type: "single",
    options: [
      { id: "self", label: "We'll run it ourselves", desc: "Our own hosting and provider accounts." },
      { id: "goodwork", label: "Goodwork runs it", desc: "Hosted, monitored and maintained, per month." },
    ],
  },
];

const PLAN = Object.fromEntries(MANAGED_PLANS.map((p) => [p.id, p]));

function recommend(answers) {
  const need = new Set(answers.need || []);
  const systems = need.has("agents") || need.has("content") || need.has("brand");
  const offers = [];

  if (answers.scale === "agency") {
    offers.push({
      offer: OFFER.agency,
      why: "You're building an agency, not one website: the programme covers positioning, offers, sales, delivery, the CRM and the launch system.",
    });
  } else {
    if (answers.who !== "us") {
      offers.push(
        systems
          ? { offer: OFFER.studio, why: "You want the systems as well as the site: Studio adds the WhatsApp bot, voice agent, Content Console and brand system to everything in the Library." }
          : { offer: OFFER.library, why: "A website you build yourself from production-ready sections and templates." },
      );
    }
    if (answers.who !== "self") {
      offers.push({ offer: OFFER.built, why: "Goodwork turns the Studio system into a complete, branded build for one business, scoped in writing first." });
    }
    if (need.has("crm")) {
      offers.push({
        offer: OFFER.crm,
        why:
          answers.who === "self"
            ? "Every lead in one place. The Embedded CRM is implemented by Goodwork, on its own or alongside a build."
            : `Every lead in one place, added to the build: ${gbp(COMBINED.total)} together, ${COMBINED.note}.`,
      });
    }
  }

  let plan = null;
  if (answers.run === "goodwork") {
    plan = need.has("agents") ? PLAN.connected : need.has("content") ? PLAN.console : PLAN.care;
    if (answers.scale === "agency" || (need.has("agents") && need.has("content") && need.has("crm"))) plan = PLAN.complete;
  }
  return { offers, plan };
}

export default function RouteFinder() {
  const [step, setStep] = useState(-1); // -1 intro, 0..n-1 questions, n result
  const [answers, setAnswers] = useState({ need: [] });
  const total = QUESTIONS.length;
  const q = QUESTIONS[step];
  const done = step >= total;
  const result = useMemo(() => (done ? recommend(answers) : null), [done, answers]);

  const value = q ? answers[q.id] : undefined;
  const ready = q ? (q.type === "multi" ? (value || []).length > 0 : Boolean(value)) : true;

  function choose(optionId) {
    if (q.type === "multi") {
      const current = new Set(answers[q.id] || []);
      if (current.has(optionId)) current.delete(optionId);
      else current.add(optionId);
      setAnswers({ ...answers, [q.id]: [...current] });
    } else {
      setAnswers({ ...answers, [q.id]: optionId });
    }
  }

  function next() {
    const n = step + 1;
    setStep(n);
    if (n === total) track(EVENTS.SERVICE_ENQUIRY_START, { form: "route-finder", ...answers, need: (answers.need || []).join(",") });
  }

  const progress = step < 0 ? 0 : Math.min(step, total) / total;

  return (
    <div className="gw-scope" aria-live="polite">
      <div className="gw-scope__head">
        <p className="gw-eyebrow">Find your route</p>
        <div className="gw-scope__progress" aria-hidden="true">
          <span style={{ width: `${Math.max(progress, step < 0 ? 0.08 : 0) * 100}%` }} />
        </div>
        <p className="gw-scope__count">{step < 0 ? `${total} questions, about a minute` : done ? "Your route" : `Question ${step + 1} of ${total}`}</p>
      </div>

      {step < 0 && (
        <div className="gw-scope__panel gw-scope__panel--in" key="intro">
          <h2 className="gw-h2">Not sure what you need? Let's work it out.</h2>
          <p className="gw-lead gw-max gw-mt-3">
            Four questions about the business: who builds it, what it needs, who it's for and who runs it afterwards. At the end you get the
            offers that fit, with the reason for each and the price in full.
          </p>
          <p className="gw-small gw-muted gw-mt-2">Nothing is committed and nothing is sent. It's a guide to the pricing page, not a form.</p>
          <div className="gw-actions gw-mt-4">
            <Button onClick={() => setStep(0)} arrow>
              Start
            </Button>
            <Button to="/pricing" variant="secondary">
              Skip, show me everything
            </Button>
          </div>
        </div>
      )}

      {q && (
        <fieldset className="gw-scope__q gw-scope__panel--in" key={q.id}>
          <legend className="gw-h2">{q.title}</legend>
          {q.hint && <p className="gw-small gw-muted gw-mt-2">{q.hint}</p>}
          <div className="gw-scope__options gw-mt-4">
            {q.options.map((o) => {
              const on = q.type === "multi" ? (value || []).includes(o.id) : value === o.id;
              return (
                <label key={o.id} className={`gw-opt${on ? " gw-opt--active" : ""}`}>
                  <input
                    className="gw-opt__input"
                    type={q.type === "multi" ? "checkbox" : "radio"}
                    name={`route-${q.id}`}
                    value={o.id}
                    checked={on}
                    onChange={() => choose(o.id)}
                  />
                  <span className="gw-opt__body">
                    <span className="gw-opt__label">{o.label}</span>
                    <span className="gw-opt__desc">{o.desc}</span>
                  </span>
                </label>
              );
            })}
          </div>
          <div className="gw-scope__nav">
            <button type="button" className="gw-scope__back" onClick={() => setStep(step - 1)}>
              ← Back
            </button>
            <Button onClick={next} disabled={!ready} arrow>
              {step === total - 1 ? "See my route" : "Next"}
            </Button>
          </div>
        </fieldset>
      )}

      {done && result && (
        <div className="gw-scope__panel--in" key="result">
          <h2 className="gw-h2">Here's the route that fits.</h2>
          <div className="gw-scope__results gw-mt-4">
            {result.offers.map(({ offer, why }) => (
              <article key={offer.id} className="gw-offer">
                <div className="gw-offer__top">
                  <span className="gw-offer__who">{offer.who}</span>
                  {offer.badge && <span className="gw-badge gw-badge--solid">{offer.badge}</span>}
                </div>
                <h3 className="gw-offer__name">{offer.name}</h3>
                <p className="gw-price">
                  <span className="gw-price__amount gw-price__amount--sm">{gbp(offer.price)}</span>
                  <span className="gw-price__term">one-time</span>
                </p>
                {offer.instalments && (
                  <p className="gw-offer__note">
                    or {offer.instalments.count} payments of {gbp(offer.instalments.amount)}, {offer.instalments.note}
                  </p>
                )}
                <p className="gw-offer__copy">{why}</p>
                <div className="gw-offer__foot">
                  <Button to={offer.primaryCta.to} arrow>
                    {offer.primaryCta.label}
                  </Button>
                  <Link to={offer.route} className="gw-small gw-link">
                    Inclusions and exclusions
                  </Link>
                </div>
              </article>
            ))}
            {result.plan && (
              <article className="gw-offer">
                <div className="gw-offer__top">
                  <span className="gw-offer__who">Managed · optional</span>
                </div>
                <h3 className="gw-offer__name">{result.plan.name}</h3>
                <p className="gw-price">
                  <span className="gw-price__amount gw-price__amount--sm">{gbp(result.plan.price)}</span>
                  <span className="gw-price__term">per month</span>
                </p>
                <p className="gw-offer__copy">{result.plan.for} Variable messaging, calling and model usage stays visible, never folded in.</p>
                <div className="gw-offer__foot">
                  <Button to="/managed" variant="secondary" arrow>
                    See the managed plans
                  </Button>
                  <span className="gw-small gw-muted">Optional: pay monthly only if Goodwork runs it.</span>
                </div>
              </article>
            )}
          </div>
          <div className="gw-scope__nav">
            <button
              type="button"
              className="gw-scope__back"
              onClick={() => {
                setAnswers({ need: [] });
                setStep(-1);
              }}
            >
              ↺ Start again
            </button>
            <Button to="/pricing" variant="secondary">
              Compare every option
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
