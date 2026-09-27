import { Link } from "react-router-dom";
import Seo from "../components/Seo";
import PageHeader from "../components/PageHeader";
import SectionHead from "../components/SectionHead";
import Reveal from "../components/Reveal";
import Button from "../components/Button";
import Price from "../components/Price";
import Includes from "../components/Includes";
import BuyButton from "../components/BuyButton";
import SystemJourney from "../components/SystemJourney";
import { OFFER, STUDIO_FEATURES, LICENCE_PRINCIPLES, MANAGED_PLANS } from "../data/offers";
import { SYSTEMS } from "../data/systems";
import { productOffer, breadcrumbs } from "../lib/schema";
import { gbp } from "../lib/format";

const offer = OFFER.studio;

export default function Studio() {
  const crumbs = [{ label: "Home", to: "/" }, { label: "Products", to: "/library" }, { label: "Goodwork Studio" }];
  return (
    <>
      <Seo title={`Goodwork Studio — ${gbp(offer.price)} one-time`} description={`${offer.outcome} ${offer.line} Self-build: you configure and deploy.`} schema={[productOffer(offer), breadcrumbs(crumbs)]} />

      <PageHeader
        crumbs={crumbs}
        eyebrow={`Goodwork Studio · ${gbp(offer.price)} one-time · you build it`}
        lines={["Build the website, brand", "and intelligent systems yourself."]}
        lead={offer.line}
        aside={
          <div className="gw-card gw-card--accent" style={{ minWidth: 300 }}>
            <span className="gw-badge gw-badge--solid">{offer.badge}</span>
            <div className="gw-mt-3">
              <Price amount={offer.price} billing="one-time" size="lg" />
            </div>
            <p className="gw-small gw-muted gw-mt-2">{offer.distinction}</p>
            <div className="gw-actions gw-mt-3">
              <Button href="#access" arrow>
                {offer.primaryCta.label}
              </Button>
              <Button href="#included" variant="ghost" size="sm">
                {offer.secondaryCta.label}
              </Button>
            </div>
          </div>
        }
      />

      <section className="gw-section--tight" id="included" aria-labelledby="included-title">
        <div className="gw-container">
          <SectionHead eyebrow="Everything included" title={<span id="included-title">Everything in Library, plus the systems.</span>} lead={offer.summary} />
          <div className="gw-mt-4">
            <Includes includes={offer.includes} excludes={offer.excludes} note="Hosting, messaging, telephony, AI-model usage and third-party subscriptions are paid to your providers, or covered by an optional managed plan with a fair-use allowance." />
          </div>
        </div>
      </section>

      <section className="gw-section" aria-labelledby="systems-title">
        <div className="gw-container">
          <SectionHead eyebrow="The systems" title={<span id="systems-title">Five systems, each with its own setup guide.</span>} />
          <div className="gw-grid gw-grid--3 gw-mt-4">
            {STUDIO_FEATURES.map((f, i) => {
              const sys = SYSTEMS.find((s) => s.slug === f.id);
              return (
                <Reveal key={f.id} variant="rise" delay={i * 60} asChild>
                  <Link to={f.to} className="gw-feature">
                    <p className="gw-eyebrow">{sys?.eyebrow}</p>
                    <h3 className="gw-h4">{f.name}</h3>
                    <p className="gw-body gw-small">{f.copy}</p>
                    <span className="gw-feature__go">See the system →</span>
                  </Link>
                </Reveal>
              );
            })}
            <Reveal variant="rise" delay={300} asChild>
              <Link to="/library" className="gw-feature">
                <p className="gw-eyebrow">Also inside</p>
                <h3 className="gw-h4">The whole Library</h3>
                <p className="gw-body gw-small">Every component, section and template in Goodwork Library is included in Studio.</p>
                <span className="gw-feature__go">Browse the Library →</span>
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="gw-section gw-surface" aria-labelledby="how-title">
        <div className="gw-container">
          <SectionHead eyebrow="How it fits together" title={<span id="how-title">One customer journey, one toolkit.</span>} lead="Studio gives you the pieces to run the whole journey yourself: the site, the qualification, the calls, the content and the pipeline." />
          <div className="gw-mt-4">
            <SystemJourney />
          </div>
        </div>
      </section>

      <section className="gw-section" aria-labelledby="selfbuild-title">
        <div className="gw-container">
          <div className="gw-split">
            <SectionHead eyebrow="Self-build, honestly" title={<span id="selfbuild-title">What you'll need on your side.</span>} lead="Studio is built for people comfortable configuring and deploying software, or with someone who is. If that isn't you, Built by Goodwork does it with you.">
              <div className="gw-actions gw-mt-4">
                <Button to="/built-by-goodwork" variant="secondary" arrow>
                  See Built by Goodwork, {gbp(OFFER.built.price)}
                </Button>
              </div>
            </SectionHead>
            <Reveal variant="rise" delay={100}>
              <div className="gw-card">
                <ul className="gw-steps">
                  <li>
                    <div>
                      <strong className="gw-strong">Somewhere to host.</strong>
                      <p className="gw-small gw-body">Static hosting for the site; an edge or Node runtime for the console and agents. Or a managed plan from {gbp(MANAGED_PLANS[0].price)} per month.</p>
                    </div>
                  </li>
                  <li>
                    <div>
                      <strong className="gw-strong">Provider accounts.</strong>
                      <p className="gw-small gw-body">WhatsApp Business, a telephony and voice provider, and a model provider. Their usage is billed to you.</p>
                    </div>
                  </li>
                  <li>
                    <div>
                      <strong className="gw-strong">A few hours with the guides.</strong>
                      <p className="gw-small gw-body">Setup guides, diagrams and checklists for each system, plus the brand discovery framework to run first.</p>
                    </div>
                  </li>
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="gw-section gw-light" id="access" aria-labelledby="access-title">
        <div className="gw-container">
          <div className="gw-split">
            <div>
              <p className="gw-eyebrow gw-eyebrow--accent">Get Goodwork Studio</p>
              <h2 className="gw-h2 gw-mt-2" id="access-title">
                The complete self-build toolkit.
              </h2>
              <p className="gw-lead gw-max gw-mt-3">{offer.outcome} One payment, {offer.includes.length} things included, {12} months of updates.</p>
              <div className="gw-mt-4" style={{ maxWidth: 420 }}>
                <Price amount={offer.price} billing="one-time" size="lg" />
                <div className="gw-mt-3">
                  <BuyButton productId="studio" label={offer.primaryCta.label} />
                </div>
                <p className="gw-small gw-muted gw-mt-2">
                  Only need the website code? <Link className="gw-link" to="/library#access">Goodwork Library is {gbp(OFFER.library.price)} one-time</Link>. Already bought? <Link className="gw-link" to="/login">Sign in</Link>.
                </p>
              </div>
            </div>
            <div style={{ display: "grid", gap: "1rem" }}>
              <div className="gw-card">
                <h3 className="gw-h4">Before you buy</h3>
                <ul className="gw-list gw-list--tight gw-mt-2">
                  <li>{offer.distinction}</li>
                  <li>Access starts immediately, so refund rights on the digital files are limited once download begins.</li>
                  <li>Commercial use for finished websites and systems for you or your clients.</li>
                  <li>No redistribution, sublicensing or resale of the raw source.</li>
                </ul>
              </div>
              <div className="gw-card gw-card--flat">
                <h3 className="gw-h4">The licence in one breath</h3>
                <ul className="gw-list gw-list--tight gw-mt-2">
                  {LICENCE_PRINCIPLES.slice(0, 5).map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
                <p className="gw-small gw-mt-2">
                  <Link className="gw-link" to="/legal/licence">Full commercial licence</Link> · <Link className="gw-link" to="/legal/refunds">Refund policy</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
