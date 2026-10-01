import { Link } from "react-router-dom";
import Seo from "../components/Seo";
import PageHeader from "../components/PageHeader";
import SectionHead from "../components/SectionHead";
import Reveal from "../components/Reveal";
import Button from "../components/Button";
import Price from "../components/Price";
import Includes from "../components/Includes";
import EnquiryForm from "../components/EnquiryForm";
import ManagedPlans from "../components/ManagedPlans";
import { OFFER, COMBINED } from "../data/offers";
import { productOffer, breadcrumbs } from "../lib/schema";
import { gbp } from "../lib/format";

const offer = OFFER.built;

const PROCESS = [
  { t: "Scope", d: "You send the enquiry below. We confirm the page set, the integrations, the two agent journeys and the revision allowance in a written proposal." },
  { t: "Brand and content", d: "You supply or approve the brand, copy and imagery. If the brand isn't settled, the brand-guideline document is created first." },
  { t: "Build", d: "The Studio system is customised for one business: website, forms, one WhatsApp flow, one voice-agent flow, the Content Console and the agreed integrations." },
  { t: "Test, launch, hand over", d: "Responsive testing, launch, and a handover that leaves you owning the build. Running costs are set up in your name, or on a managed plan." },
];

export default function BuiltByGoodwork() {
  const crumbs = [{ label: "Home", to: "/" }, { label: "Services", to: "/services" }, { label: "Built by Goodwork" }];
  return (
    <>
      <Seo title={`Built by Goodwork — ${gbp(offer.price)} done-for-you business website and systems`} description={`${offer.outcome} A defined implementation of the Goodwork Studio system for one business, scoped first. ${gbp(offer.price)} one-time; running costs separate.`} schema={[productOffer(offer), breadcrumbs(crumbs)]} />

      <PageHeader
        crumbs={crumbs}
        eyebrow={`Built by Goodwork · ${gbp(offer.price)} one-time · we build it with you`}
        lines={["Give us the business.", "We'll build the system."]}
        lead={offer.line}
        aside={
          <div className="gw-card" style={{ minWidth: 300 }}>
            <p className="gw-eyebrow">Implementation fee</p>
            <div className="gw-mt-2">
              <Price amount={offer.price} billing="one-time" size="lg" />
            </div>
            <p className="gw-small gw-muted gw-mt-2">One business, one website, agreed scope. Third-party and operational charges not included.</p>
            <div className="gw-actions gw-mt-3">
              <Button href="#enquire" arrow>
                {offer.primaryCta.label}
              </Button>
              <Button href="#scope" variant="ghost" size="sm">
                {offer.secondaryCta.label}
              </Button>
            </div>
          </div>
        }
      />

      <section className="gw-section--tight" id="scope" aria-labelledby="scope-title">
        <div className="gw-container">
          <SectionHead eyebrow="What the fee covers" title={<span id="scope-title">A defined build, not an open-ended project.</span>} lead={offer.summary} />
          <div className="gw-mt-4">
            <Includes includes={offer.includes} excludes={offer.excludes} excludesTitle="Not in the fee" note="Anything quoted separately is quoted before it starts, never discovered on an invoice." />
          </div>
        </div>
      </section>

      <section className="gw-section gw-surface" aria-labelledby="boundaries-title">
        <div className="gw-container">
          <div className="gw-split">
            <SectionHead eyebrow="Scope boundaries" title={<span id="boundaries-title">Visible before you enquire.</span>} lead="These are the lines that keep the price fixed. They are written into the proposal and agreed before work begins." />
            <Reveal variant="rise" delay={100}>
              <div className="gw-card">
                <ul className="gw-list">
                  {offer.scope.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="gw-section" aria-labelledby="process-title">
        <div className="gw-container">
          <SectionHead eyebrow="How it runs" title={<span id="process-title">Scope first. Build properly. Hand over cleanly.</span>} />
          <div className="gw-grid gw-grid--4 gw-mt-4">
            {PROCESS.map((p, i) => (
              <Reveal key={p.t} variant="rise" delay={i * 60} asChild>
                <div className="gw-card">
                  <span className="gw-eyebrow gw-eyebrow--accent">0{i + 1}</span>
                  <h3 className="gw-h4 gw-mt-2">{p.t}</h3>
                  <p className="gw-small gw-body gw-mt-1">{p.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="gw-section gw-light" aria-labelledby="crm-title">
        <div className="gw-container">
          <div className="gw-addon">
            <div>
              <p className="gw-eyebrow gw-eyebrow--accent">Add the CRM</p>
              <h2 className="gw-h3 gw-mt-1" id="crm-title">
                {OFFER.crm.name}, <span className="gw-nowrap">{gbp(OFFER.crm.price)} one-time</span>
              </h2>
              <p className="gw-body gw-mt-2">{OFFER.crm.outcome} The server is expressly excluded.</p>
            </div>
            <div className="gw-sum">
              <div><span>Built by Goodwork</span><span>{gbp(OFFER.built.price)}</span></div>
              <div><span>Embedded CRM</span><span>{gbp(OFFER.crm.price)}</span></div>
              <div><span>{COMBINED.label}<br /><small>{COMBINED.note}</small></span><span>{gbp(COMBINED.total)}</span></div>
            </div>
            <div className="gw-actions" style={{ flexDirection: "column", alignItems: "stretch" }}>
              <Button to="/crm" variant="paper" arrow>
                See CRM Features
              </Button>
              <Link to="/crm#enquire" className="gw-small gw-link">Discuss Your CRM</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="gw-section" aria-labelledby="running-title">
        <div className="gw-container">
          <SectionHead eyebrow="After launch" title={<span id="running-title">What continues to cost money, and who pays it.</span>} lead="Your build is yours. Hosting, messaging, telephony and AI usage are paid to your providers in your name, or you can ask us to run the live system on a managed plan." />
          <div className="gw-mt-4">
            <ManagedPlans cta={false} />
          </div>
        </div>
      </section>

      <section className="gw-section gw-surface" id="enquire" aria-labelledby="enquire-title">
        <div className="gw-container">
          <div className="gw-split" style={{ "--gw-split": "minmax(0,0.8fr) minmax(0,1.2fr)" }}>
            <SectionHead eyebrow="Start your build" title={<span id="enquire-title">Tell us about the business.</span>} lead="This is the structured enquiry, not a payment. We confirm scope, timeline and the fixed fee in writing, and nothing starts until you've agreed it.">
              <div className="gw-card gw-card--flat gw-mt-4">
                <p className="gw-eyebrow">What happens next</p>
                <ul className="gw-list gw-list--tight gw-mt-2">
                  <li>A reply within one working day</li>
                  <li>A short call if anything needs clarifying</li>
                  <li>A written proposal with the agreed scope and revision allowance</li>
                </ul>
              </div>
            </SectionHead>
            <Reveal variant="rise" delay={100}>
              <div className="gw-card">
                <EnquiryForm formId="built" source="built-page" />
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
