import Seo from "../components/Seo";
import PageHeader from "../components/PageHeader";
import SectionHead from "../components/SectionHead";
import Reveal from "../components/Reveal";
import Button from "../components/Button";
import ServicePosters from "../components/ServicePosters";
import Display from "../components/Display";
import Stamp from "../components/Stamp";
import RouteFinder from "../components/RouteFinder";
import ManagedPlans from "../components/ManagedPlans";
import { OFFER, COMBINED, MANAGED_PLANS } from "../data/offers";
import { breadcrumbs } from "../lib/schema";
import { gbp, gbpRange, offerAmount } from "../lib/format";

// How every service runs: the original site's four words, with what each
// step means for the services Goodwork sells now.
const PROCESS = [
  { mark: "1", title: "Understand", desc: "A structured enquiry for each service, then a conversation about how the business wins work today and where enquiries leak." },
  { mark: "2", title: "Think", desc: "A written proposal with the fixed fee, the scope boundaries and the revision allowance. Nothing starts until you've agreed it." },
  { mark: "3", title: "Make", desc: "The Goodwork system, customised and connected for your business. It doesn't go live until it's verified: links, forms, tracking, the lot." },
  { mark: "4", title: "Improve", desc: "You own the build. Run it yourself, or put it on a managed plan and Goodwork keeps it hosted, monitored and maintained." },
];

export default function Services() {
  const crumbs = [{ label: "Home", to: "/" }, { label: "Services" }];
  return (
    <>
      <Seo
        title="Services — implementation, CRM, agency building and managed infrastructure"
        description={`Built by Goodwork (${gbp(OFFER.built.price)}), the Embedded CRM (${offerAmount(OFFER.crm)}), the Agency programme (${gbp(OFFER.agency.price)}) and optional managed infrastructure from ${gbp(MANAGED_PLANS[0].price)} per month. Scoped first, then built.`}
        schema={breadcrumbs(crumbs)}
      />

      <PageHeader
        crumbs={crumbs}
        eyebrow="Services · we build it with you"
        lines={["I want the outcome,", "not the assembly."]}
        lead="Give us the business requirements. We customise, connect and launch the system for you, with the scope agreed first and the running costs kept visible."
      >
        <div className="gw-actions">
          <Button to="/built-by-goodwork" arrow>
            Start with Built by Goodwork
          </Button>
          <Button to="/pricing" variant="secondary">
            Compare every option
          </Button>
        </div>
      </PageHeader>

      <hr className="gw-rule--gradient" />

      {/* The three services */}
      <section className="gw-section" aria-labelledby="services-title">
        <div className="gw-container">
          <SectionHead eyebrow="The services" title={<span id="services-title">Three ways Goodwork builds it with you.</span>} />
          <div className="gw-mt-4">
            <ServicePosters timeline={false} />
          </div>
          <Reveal variant="rise" className="gw-mt-3">
            <div className="gw-card gw-card--flat" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "1rem", alignItems: "center" }}>
              <p className="gw-body">
                <span className="gw-strong">{COMBINED.label}:</span> Built by Goodwork {gbp(OFFER.built.price)} + Embedded CRM {offerAmount(OFFER.crm)} ={" "}
                <span className="gw-strong">{gbpRange(COMBINED.total, COMBINED.totalTo)}</span> {COMBINED.note}.
              </p>
              <Button to="/built-by-goodwork#enquire" variant="secondary" size="sm" arrow>
                Start Your Build
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Not sure? The route finder, in the original scope-builder style */}
      <section className="gw-section gw-light" aria-label="Find your route">
        <div className="gw-container">
          <RouteFinder />
        </div>
      </section>

      {/* A closer look */}
      <section className="gw-dark" aria-labelledby="closer-title">
        <div className="gw-block__rule" aria-hidden="true" />
        <div className="gw-block">
          <div className="gw-container">
            <Reveal variant="rise">
              <div className="gw-approved" style={{ marginBottom: 28 }}>
                <Stamp size={120} />
                <div>
                  <p className="gw-eyebrow">A closer look</p>
                  <Display id="closer-title" className="gw-display--md gw-mt-2">
                    Built by
                    <br />
                    Goodwork
                  </Display>
                </div>
              </div>
              <p className="gw-lead gw-max">{OFFER.built.line}</p>
              <p className="gw-body gw-max gw-mt-2">{OFFER.built.summary}</p>
            </Reveal>
            <ul className="gw-features-detail gw-mt-4">
              {OFFER.built.includes.slice(0, 8).map((x, i) => (
                <Reveal key={x} variant="rise" delay={Math.min(i * 60, 280)} asChild>
                  <li>{x}</li>
                </Reveal>
              ))}
            </ul>
            <Reveal variant="rise">
              <p className="gw-small gw-muted gw-mt-4">
                Scope: {OFFER.built.scope.slice(0, 5).join(" · ")}. {OFFER.built.scope[6]}. Third-party and operational charges are not included in the{" "}
                {gbp(OFFER.built.price)} fee.
              </p>
              <div className="gw-actions gw-mt-4">
                <Button to="/built-by-goodwork" arrow>
                  See the full scope
                </Button>
                <Button to="/built-by-goodwork#enquire" variant="secondary">
                  Start Your Build
                </Button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* How it runs */}
      <section className="gw-section" aria-labelledby="how-title">
        <div className="gw-container">
          <Reveal variant="rise">
            <p className="gw-eyebrow">How it runs</p>
            <h2 className="gw-display gw-display--md gw-mt-2" id="how-title">
              What actually
              <br />
              happens
            </h2>
            <p className="gw-lead gw-max gw-mt-3">Four steps, no agency theatre. You'll know the scope and the price before anything is built.</p>
          </Reveal>
          <div className="gw-process gw-mt-4">
            {PROCESS.map((p, i) => (
              <Reveal key={p.mark} variant="left" delay={i * 90} asChild>
                <div className="gw-process__row">
                  <div className="gw-process__mark">{p.mark}</div>
                  <div className="gw-process__body">
                    <strong>{p.title}</strong>
                    <span>{p.desc}</span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Managed */}
      <section className="gw-section gw-light" aria-labelledby="managed-title">
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
