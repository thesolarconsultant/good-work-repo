import Deck from "../components/deck/Deck";
import Headline from "../components/Headline";
import Button from "../components/Button";
import Shot from "../components/Shot";
import { LADDER, OFFER, COMBINED, MANAGED_PLANS, CRM_RUNNING, COACHING, OWNERSHIP_PRINCIPLE, JOURNEY, VALUE_LADDER_SENTENCE } from "../data/offers";
import { SHOWCASE } from "../data/showcase";
import { gbp, gbpRange, offerAmount, priceLabel } from "../lib/format";

// A live, presenter-driven pitch for Goodwork itself. Every price, inclusion
// and case-study fact is read from the same data the public site uses, so the
// deck can never say something the site doesn't.

const tsc = SHOWCASE.find((c) => c.id === "tsc");
const eightEnergy = SHOWCASE.find((c) => c.id === "8energy");

function ProofSlide({ cs, reverse = false }) {
  const shot = <Shot src={cs.shots[0].src} alt={cs.shots[0].caption} caption={cs.shots[0].caption} sizes="(max-width: 820px) 100vw, 560px" />;
  const copy = (
    <div>
      <span className="gw-deck__kicker">Proof — {cs.name}</span>
      <Headline onMount as="h2" className="gw-h2" lines={[cs.name]} />
      <p className="gw-deck__lede" style={{ marginInline: 0 }}>
        {cs.created}
      </p>
      <div className="gw-facts gw-facts--pair" style={{ marginTop: "1.5rem" }}>
        {cs.facts.slice(0, 2).map((f) => (
          <div key={f.label} className="gw-fact">
            <span className="gw-fact__figure">{f.figure}</span>
            <span className="gw-fact__label">{f.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
  return <div className="gw-deck__proof">{reverse ? [shot, copy] : [copy, shot]}</div>;
}

const SLIDES = [
  {
    label: "Open",
    content: (
      <>
        <span className="gw-deck__kicker">Goodwork</span>
        <Headline onMount as="h1" className="gw-h1 gw-stack-lg" lines={["Build better.", "Launch faster."]} />
        <p className="gw-deck__lede">Production-ready websites, AI agents and business systems. Use the tools yourself, or let Goodwork build the complete operation for you.</p>
      </>
    ),
  },
  {
    label: "Two sides",
    content: (
      <>
        <span className="gw-deck__kicker">The business</span>
        <Headline onMount as="h2" className="gw-h2" lines={["Goodwork Products.", "Goodwork Services."]} />
        <p className="gw-deck__lede">Reusable code, templates and intelligent systems on one side. Implementation, customisation, infrastructure and agency building on the other. Build with Goodwork, or have Goodwork build it.</p>
      </>
    ),
  },
  {
    label: "The journey",
    content: (
      <>
        <span className="gw-deck__kicker">The connected system</span>
        <Headline onMount as="h2" className="gw-h2" lines={["More than pretty sections."]} />
        <ul className="gw-deck__list">
          {JOURNEY.map((j, i) => (
            <li key={j.id} style={{ "--gw-deck-i": i }}>
              {j.step}
            </li>
          ))}
        </ul>
      </>
    ),
  },
  { label: `Proof — ${tsc.name}`, content: <ProofSlide cs={tsc} /> },
  { label: `Proof — ${eightEnergy.name}`, content: <ProofSlide cs={eightEnergy} reverse /> },
  {
    label: "The ladder",
    content: (
      <>
        <span className="gw-deck__kicker">The offers</span>
        <Headline onMount as="h2" className="gw-h2" lines={["Start where you are.", "Move up when you need us."]} />
        <p className="gw-deck__lede">{VALUE_LADDER_SENTENCE}</p>
      </>
    ),
  },
  ...LADDER.map((o, i) => ({
    label: o.short,
    content: (
      <>
        <span className="gw-deck__kicker">
          Offer {i + 1} of {LADDER.length} · {o.who}
        </span>
        <Headline onMount as="h2" className="gw-h1" lines={[o.short]} />
        <div className="gw-deck__pkg-solo-price">
          <span className="gw-deck__pkg-solo-figure gw-mono">{offerAmount(o)}</span>
          <span className="gw-deck__pkg-solo-monthly">{o.billing === "monthly" ? "per month" : "one-time"}</span>
        </div>
        <p className="gw-deck__lede">{o.line}</p>
        <div className="gw-deck__pkg-ladder">
          {LADDER.map((p) => (
            <span key={p.id} className={`gw-deck__pkg-step${p.id === o.id ? " is-active" : ""}`}>
              {p.short}
            </span>
          ))}
        </div>
      </>
    ),
  })),
  {
    label: "Embedded CRM",
    content: (
      <>
        <span className="gw-deck__kicker">Add-on or standalone · {OFFER.crm.who}</span>
        <Headline onMount as="h2" className="gw-h1" lines={[OFFER.crm.short]} />
        <div className="gw-deck__pkg-solo-price">
          <span className="gw-deck__pkg-solo-figure gw-mono">{gbp(OFFER.crm.price)}</span>
          <span className="gw-deck__pkg-solo-monthly">one-time, standard build · up to {gbp(OFFER.crm.priceTo)} with premium connectors · server excluded</span>
        </div>
        <p className="gw-deck__lede">
          {OFFER.crm.outcome} With Built by Goodwork: {gbpRange(COMBINED.total, COMBINED.totalTo)} plus infrastructure.
        </p>
      </>
    ),
  },
  {
    label: "Managed",
    content: (
      <>
        <span className="gw-deck__kicker">Optional · per month</span>
        <Headline onMount as="h2" className="gw-h2" lines={["Own the build.", "Choose who runs it."]} />
        <p className="gw-deck__lede">{OWNERSHIP_PRINCIPLE}</p>
        <div className="gw-deck__grid4">
          {MANAGED_PLANS.map((p, i) => (
            <div className="gw-deck__card" key={p.id} style={{ "--gw-deck-i": i }}>
              <strong>{p.name}</strong>
              <span className="gw-mono">{priceLabel(p.price, "monthly")}</span>
              <span>{p.for}</span>
            </div>
          ))}
        </div>
        <p className="gw-deck__pkg-note">
          Goodwork running the CRM too: {priceLabel(CRM_RUNNING.price, "monthly")} on any plan. Ads and business development: the {COACHING.name.toLowerCase()}, {COACHING.priceNote.toLowerCase()}.
        </p>
      </>
    ),
  },
  {
    label: "Close",
    content: (
      <>
        <Headline onMount as="h2" className="gw-h1 gw-stack-lg" lines={["Choose the fastest route", "to better work."]} />
        <p className="gw-deck__lede">Start with the code, take the complete Studio toolkit or ask Goodwork to build the system with you.</p>
        <div className="gw-deck__actions">
          <Button to="/pricing" variant="paper" arrow>
            Compare every option
          </Button>
          <Button to="/contact" variant="secondary" arrow>
            Talk to Goodwork
          </Button>
        </div>
      </>
    ),
  },
];

export default function Pitch() {
  return <Deck slides={SLIDES} title="The Goodwork pitch" description="A presenter-led walkthrough of what Goodwork sells, built from the same offers and showcase data published on the site." />;
}
