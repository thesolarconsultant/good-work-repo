import { Link } from "react-router-dom";
import Seo from "../components/Seo";
import PageHeader from "../components/PageHeader";
import SectionHead from "../components/SectionHead";
import Reveal from "../components/Reveal";
import Button from "../components/Button";
import Price from "../components/Price";
import ManagedPlans from "../components/ManagedPlans";
import { OFFER, COMBINED } from "../data/offers";
import { breadcrumbs } from "../lib/schema";
import { gbp } from "../lib/format";

const SERVICES = [OFFER.built, OFFER.crm, OFFER.agency];

export default function Services() {
  const crumbs = [{ label: "Home", to: "/" }, { label: "Services" }];
  return (
    <>
      <Seo title="Services — implementation, CRM, agency building and managed infrastructure" description={`Built by Goodwork (${gbp(OFFER.built.price)}), the Embedded CRM (${gbp(OFFER.crm.price)}), the Agency programme (${gbp(OFFER.agency.price)}) and optional managed infrastructure from ${gbp(28)} per month. Scoped first, then built.`} schema={breadcrumbs(crumbs)} />

      <PageHeader crumbs={crumbs} eyebrow="Goodwork Services · we build it with you" lines={["I want the outcome,", "not the assembly."]} lead="Give us the business requirements. We customise, connect and launch the system for you, with the scope agreed first and the running costs kept visible.">
        <div className="gw-actions">
          <Button to="/built-by-goodwork" arrow>
            Start with Built by Goodwork
          </Button>
          <Button to="/pricing" variant="secondary">
            Compare every option
          </Button>
        </div>
      </PageHeader>

      <section className="gw-section--tight" aria-labelledby="services-title">
        <div className="gw-container">
          <h2 className="gw-sr-only" id="services-title">
            The services
          </h2>
          <div className="gw-grid gw-grid--3">
            {SERVICES.map((o, i) => (
              <Reveal key={o.id} variant="rise" delay={i * 70} asChild>
                <article className="gw-offer" aria-labelledby={`svc-${o.id}`}>
                  <div className="gw-offer__top">
                    <span className="gw-offer__who">{o.who}</span>
                    {o.addon && <span className="gw-badge gw-badge--muted">Add-on or standalone</span>}
                  </div>
                  <div>
                    <h3 className="gw-offer__name" id={`svc-${o.id}`}>
                      {o.name}
                    </h3>
                    <div className="gw-mt-2">
                      <Price amount={o.price} billing="one-time" />
                    </div>
                    {o.instalments && (
                      <p className="gw-offer__note gw-mt-1">
                        or {o.instalments.count} payments of {gbp(o.instalments.amount)}, {o.instalments.note}
                      </p>
                    )}
                  </div>
                  <p className="gw-offer__copy">{o.outcome}</p>
                  <ul className="gw-list gw-list--tight">
                    {o.includes.slice(0, 4).map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                  <div className="gw-offer__foot">
                    <Button to={o.primaryCta.to} variant={i === 0 ? "primary" : "secondary"} arrow>
                      {o.primaryCta.label}
                    </Button>
                    <Link to={o.route} className="gw-small gw-link">
                      Scope, inclusions and exclusions
                    </Link>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
          <Reveal variant="rise" className="gw-mt-3">
            <div className="gw-card gw-card--flat" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "1rem", alignItems: "center" }}>
              <p className="gw-body">
                <span className="gw-strong">{COMBINED.label}:</span> Built by Goodwork {gbp(OFFER.built.price)} + Embedded CRM {gbp(OFFER.crm.price)} ={" "}
                <span className="gw-mono gw-strong">{gbp(COMBINED.total)}</span> {COMBINED.note}.
              </p>
              <Button to="/built-by-goodwork#enquire" variant="secondary" size="sm" arrow>
                Start Your Build
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="gw-section gw-light" aria-labelledby="how-title">
        <div className="gw-container">
          <div className="gw-split">
            <SectionHead eyebrow="How every service runs" title={<span id="how-title">Scoped in writing before anything starts.</span>} lead="Page limits, integrations, agent journeys and revision rounds are agreed first. Third-party and operational charges are never inside the fee, so there is nothing to discover later." />
            <Reveal variant="rise" delay={100}>
              <ul className="gw-steps">
                <li><p className="gw-body"><span className="gw-strong">Enquire.</span> A structured form for each service, so the first reply is useful.</p></li>
                <li><p className="gw-body"><span className="gw-strong">Scope.</span> A written proposal with the fixed fee, the boundaries and the revision allowance.</p></li>
                <li><p className="gw-body"><span className="gw-strong">Build.</span> The Goodwork system, customised and connected for your business.</p></li>
                <li><p className="gw-body"><span className="gw-strong">Launch and hand over.</span> You own the build. Running costs are yours or on a managed plan.</p></li>
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="gw-section" aria-labelledby="managed-title">
        <div className="gw-container">
          <div className="gw-pagehead__row">
            <SectionHead eyebrow="Managed infrastructure · optional" title={<span id="managed-title">Own the build. Choose who runs it.</span>} />
            <Reveal variant="rise" delay={100}>
              <Button to="/managed" variant="secondary" arrow>
                Managed plans in detail
              </Button>
            </Reveal>
          </div>
          <div className="gw-mt-4">
            <ManagedPlans cta={false} />
          </div>
        </div>
      </section>
    </>
  );
}
