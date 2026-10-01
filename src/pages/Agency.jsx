import Seo from "../components/Seo";
import PageHeader from "../components/PageHeader";
import SectionHead from "../components/SectionHead";
import Reveal from "../components/Reveal";
import Button from "../components/Button";
import Price from "../components/Price";
import EnquiryForm from "../components/EnquiryForm";
import { OFFER } from "../data/offers";
import { productOffer, breadcrumbs } from "../lib/schema";
import { gbp } from "../lib/format";

const offer = OFFER.agency;

const PILLARS = [
  { t: "Positioning and offers", items: offer.includes.slice(0, 3) },
  { t: "Brand and platform", items: offer.includes.slice(3, 8) },
  { t: "Sales and delivery system", items: offer.includes.slice(8, 16) },
  { t: "Operating model and launch", items: offer.includes.slice(16) },
];

const FIT = [
  "An existing agency whose positioning, packages or delivery system no longer match the work",
  "A freelancer or consultant moving to an agency model with repeatable offers",
  "A founder starting an agency who wants the operation built properly from day one",
];

export default function Agency() {
  const crumbs = [{ label: "Home", to: "/" }, { label: "Services", to: "/services" }, { label: "Build Your Agency" }];
  return (
    <>
      <Seo title={`We Help Build Your Agency — ${gbp(offer.price)} programme`} description={`${offer.outcome} ${offer.line} ${gbp(offer.price)} paid in full or four payments of ${gbp(offer.instalments.amount)}.`} schema={[productOffer(offer), breadcrumbs(crumbs)]} />

      <PageHeader
        crumbs={crumbs}
        eyebrow="The Agency programme · we build the operation"
        lines={["We do not just build your", "agency website."]}
        lead="We help build the agency behind it. Positioning, offers, brand, sales process, delivery system, CRM, automation and launch infrastructure, installed with you over defined sessions."
        aside={
          <div className="gw-card gw-card--accent" style={{ minWidth: 320 }}>
            <p className="gw-eyebrow">Investment</p>
            <div className="gw-mt-2">
              <Price amount={offer.price} billing="one-time" size="lg" term="paid in full" />
            </div>
            <p className="gw-small gw-mt-2">
              or {offer.instalments.count} payments of <span className="gw-mono">{gbp(offer.instalments.amount)}</span>, {offer.instalments.note}
            </p>
            <div className="gw-actions gw-mt-3">
              <Button href="#apply" arrow>
                {offer.primaryCta.label}
              </Button>
            </div>
            <p className="gw-small gw-muted gw-mt-2">Applications are reviewed by a person. Selective by design.</p>
          </div>
        }
      />

      <section className="gw-section--tight" aria-labelledby="pillars-title">
        <div className="gw-container">
          <SectionHead eyebrow="What the programme installs" title={<span id="pillars-title">The operation, in four parts.</span>} lead={offer.summary} />
          <div className="gw-grid gw-grid--2 gw-mt-4">
            {PILLARS.map((p, i) => (
              <Reveal key={p.t} variant="rise" delay={i * 60} asChild>
                <div className="gw-card">
                  <span className="gw-eyebrow gw-eyebrow--accent">0{i + 1}</span>
                  <h3 className="gw-h3 gw-mt-2">{p.t}</h3>
                  <ul className="gw-list gw-list--tight gw-mt-3">
                    {p.items.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="gw-section gw-surface" aria-labelledby="licence-title">
        <div className="gw-container">
          <div className="gw-split">
            <SectionHead eyebrow="The commercial licence" title={<span id="licence-title">Deliver with the systems. Don't resell the source.</span>} lead={offer.licenceNote} />
            <Reveal variant="rise" delay={100}>
              <div className="gw-card gw-card--flat">
                <h3 className="gw-h4">Not included</h3>
                <ul className="gw-list gw-list--x gw-mt-2">
                  {offer.excludes.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
                <p className="gw-small gw-muted gw-mt-3">Hosting, telephony, messaging and AI-model usage for the agency and its clients are paid to the providers, or covered by managed plans with fair-use allowances.</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="gw-section" aria-labelledby="fit-title">
        <div className="gw-container">
          <div className="gw-split">
            <SectionHead eyebrow="Who it is for" title={<span id="fit-title">Serious about the operation, not just the website.</span>} />
            <Reveal variant="rise" delay={100}>
              <ul className="gw-steps">
                {FIT.map((x) => (
                  <li key={x}>
                    <p className="gw-body">{x}</p>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="gw-section gw-light" id="apply" aria-labelledby="apply-title">
        <div className="gw-container">
          <div className="gw-split" style={{ "--gw-split": "minmax(0,0.8fr) minmax(0,1.2fr)" }}>
            <SectionHead eyebrow="Apply" title={<span id="apply-title">Apply to build your agency.</span>} lead="Tell us where the agency is, what it sells and what is holding it back. If it looks like a fit, the next step is a conversation.">
              <div className="gw-card gw-mt-4">
                <p className="gw-eyebrow">Payment routes</p>
                <ul className="gw-list gw-list--tight gw-mt-2">
                  <li>{gbp(offer.price)} paid in full</li>
                  <li>
                    {offer.instalments.count} payments of {gbp(offer.instalments.amount)}, {offer.instalments.note}
                  </li>
                </ul>
              </div>
            </SectionHead>
            <Reveal variant="rise" delay={100}>
              <div className="gw-card">
                <EnquiryForm formId="agency" source="agency-page" />
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
