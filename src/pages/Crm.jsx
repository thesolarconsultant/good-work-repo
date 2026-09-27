import Seo from "../components/Seo";
import PageHeader from "../components/PageHeader";
import SectionHead from "../components/SectionHead";
import Reveal from "../components/Reveal";
import Button from "../components/Button";
import Price from "../components/Price";
import Includes from "../components/Includes";
import EnquiryForm from "../components/EnquiryForm";
import { OFFER, COMBINED } from "../data/offers";
import { productOffer, breadcrumbs } from "../lib/schema";
import { gbp } from "../lib/format";

const offer = OFFER.crm;

export default function Crm() {
  const crumbs = [{ label: "Home", to: "/" }, { label: "Services", to: "/services" }, { label: "Embedded CRM" }];
  return (
    <>
      <Seo title={`Goodwork Embedded CRM — ${gbp(offer.price)} one-time implementation`} description={`${offer.outcome} Standalone or as an add-on to Built by Goodwork. Server, hosting and communication costs excluded.`} schema={[productOffer(offer), breadcrumbs(crumbs)]} />

      <PageHeader
        crumbs={crumbs}
        eyebrow={`Embedded CRM · ${gbp(offer.price)} one-time · we build it with you`}
        lines={["Keep every lead, answer and", "next action in one place."]}
        lead={offer.outcome + " Available as a standalone implementation or as an add-on to Built by Goodwork."}
        aside={
          <div className="gw-card" style={{ minWidth: 300 }}>
            <p className="gw-eyebrow">Implementation fee</p>
            <div className="gw-mt-2">
              <Price amount={offer.price} billing="one-time" size="lg" />
            </div>
            <p className="gw-small gw-muted gw-mt-2">The server is expressly excluded. Communication usage stays separate.</p>
            <div className="gw-actions gw-mt-3">
              <Button href="#enquire" arrow>
                {offer.primaryCta.label}
              </Button>
              <Button href="#features" variant="ghost" size="sm">
                {offer.secondaryCta.label}
              </Button>
            </div>
          </div>
        }
      />

      <section className="gw-section--tight" id="features" aria-labelledby="features-title">
        <div className="gw-container">
          <SectionHead eyebrow="CRM features" title={<span id="features-title">Built around the pipeline you actually run.</span>} lead="Records, pipeline, forms, tasks, roles and a dashboard, configured for one business. Not a bespoke CRM product; a well-implemented one." />
          <div className="gw-mt-4">
            <Includes includes={offer.includes} excludes={offer.excludes} note="Ongoing maintenance is available on a managed plan; otherwise the CRM is handed over for you to run." />
          </div>
        </div>
      </section>

      <section className="gw-section gw-light" aria-labelledby="combined-title">
        <div className="gw-container">
          <div className="gw-split">
            <SectionHead eyebrow="Ownership and operating cost" title={<span id="combined-title">Two clear numbers.</span>} lead="One implementation fee to own it. Your server and your communication providers, paid by you, so ownership and operating cost never blur." />
            <Reveal variant="rise" delay={100}>
              <div className="gw-card">
                <p className="gw-eyebrow">With Built by Goodwork</p>
                <div className="gw-sum gw-mt-3">
                  <div><span>Built by Goodwork</span><span>{gbp(OFFER.built.price)}</span></div>
                  <div><span>Embedded CRM</span><span>{gbp(offer.price)}</span></div>
                  <div><span>{COMBINED.label}<br /><small>{COMBINED.note}</small></span><span>{gbp(COMBINED.total)}</span></div>
                </div>
                <p className="gw-small gw-muted gw-mt-3">Standalone CRM implementation is {gbp(offer.price)} one-time on its own.</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="gw-section" id="enquire" aria-labelledby="enquire-title">
        <div className="gw-container">
          <div className="gw-split" style={{ gridTemplateColumns: "minmax(0,0.8fr) minmax(0,1.2fr)" }}>
            <SectionHead eyebrow="Discuss your CRM" title={<span id="enquire-title">Tell us how you sell.</span>} lead="Users, pipeline stages, what needs connecting and where you'd like it hosted. We confirm the setup before anything is built." />
            <Reveal variant="rise" delay={100}>
              <div className="gw-card">
                <EnquiryForm formId="crm" source="crm-page" />
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
