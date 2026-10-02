import { useEffect } from "react";
import { Link } from "react-router-dom";
import Seo from "../components/Seo";
import PageHeader from "../components/PageHeader";
import SectionHead from "../components/SectionHead";
import Reveal from "../components/Reveal";
import Button from "../components/Button";
import Price from "../components/Price";
import OfferLadder, { CrmBand } from "../components/OfferLadder";
import ComparisonTable from "../components/ComparisonTable";
import ManagedPlans from "../components/ManagedPlans";
import FaqList from "../components/FaqList";
import BuyButton from "../components/BuyButton";
import OfferIcon from "../components/OfferIcon";
import { OFFERS, OFFER, COMBINED, MANAGED_PLANS, FAQ, VALUE_LADDER_SENTENCE, OWNERSHIP_PRINCIPLE, LICENCE_PRINCIPLES } from "../data/offers";
import { productOffer, faqPage, breadcrumbs } from "../lib/schema";
import { gbp, gbpRange, offerAmount } from "../lib/format";
import { track, EVENTS } from "../lib/analytics";

const THREE = [
  { q: "What am I buying?", a: "Library and Studio are one-time digital products you own. Built by Goodwork, the Embedded CRM and the Agency programme are one-time services scoped in writing." },
  { q: "Who does the implementation?", a: "You build it with Library and Studio. We build it with you on Built by Goodwork. We build the operation on the Agency programme." },
  { q: "What will continue to cost money?", a: `Hosting, messaging, telephony and AI usage, paid to your providers, or an optional managed plan from ${gbp(MANAGED_PLANS[0].price)} per month.` },
];

export default function Pricing() {
  const crumbs = [{ label: "Home", to: "/" }, { label: "Pricing" }];
  useEffect(() => {
    track(EVENTS.PRICING_VIEW, {});
  }, []);

  return (
    <>
      <Seo title={`Pricing — ${gbp(OFFER.library.price)} Library, ${gbp(OFFER.studio.price)} Studio, ${gbp(OFFER.built.price)} Built by Goodwork, CRM from ${gbp(OFFER.crm.price)}, ${gbp(OFFER.agency.price)} Agency`} description={`${VALUE_LADDER_SENTENCE} ${OWNERSHIP_PRINCIPLE}`} schema={[...OFFERS.map((o) => productOffer(o, { path: "/pricing" })), faqPage(FAQ), breadcrumbs(crumbs)]} />

      <PageHeader crumbs={crumbs} eyebrow="Pricing · all figures one-time unless marked per month" lines={["Simple to understand.", "Detailed when you want it."]} lead={VALUE_LADDER_SENTENCE}>
        <div className="gw-grid gw-grid--3">
          {THREE.map((t) => (
            <div key={t.q} className="gw-card gw-card--flat">
              <h2 className="gw-h4">{t.q}</h2>
              <p className="gw-small gw-body gw-mt-1">{t.a}</p>
            </div>
          ))}
        </div>
      </PageHeader>

      <section className="gw-section--tight gw-section--flush" aria-labelledby="ladder-title">
        <div className="gw-container">
          <h2 className="gw-sr-only" id="ladder-title">
            The offers
          </h2>
          <OfferLadder />
        </div>
        <CrmBand />
      </section>

      <section className="gw-section" id="compare" aria-labelledby="compare-title">
        <div className="gw-container">
          <SectionHead eyebrow="Compare every option" title={<span id="compare-title">What each one includes, grouped.</span>} lead="You build it with Library and Studio. We build it with you on Built by Goodwork. We build the operation on Build Your Agency. The Embedded CRM and the managed plans follow below." />
          <div className="gw-mt-4">
            <ComparisonTable />
          </div>
        </div>
      </section>

      <section className="gw-section gw-light" id="buy" aria-labelledby="buy-title">
        <div className="gw-container">
          <SectionHead eyebrow="Direct purchase" title={<span id="buy-title">The two products you can buy today.</span>} lead="Library and Studio are paid online. Services are scoped first, so they start with an enquiry or an application rather than a checkout." />
          <div className="gw-grid gw-grid--2 gw-mt-4">
            {[OFFER.library, OFFER.studio].map((o) => (
              <Reveal key={o.id} variant="rise" asChild>
                <div className={`gw-card${o.badge ? " gw-card--accent" : ""}`}>
                  <div className="gw-offer__top">
                    <span className="gw-offer__who">
                      <OfferIcon id={o.id} />
                      {o.who}
                    </span>
                    {o.badge && <span className="gw-badge gw-badge--solid">{o.badge}</span>}
                  </div>
                  <h3 className="gw-h3 gw-mt-2">{o.name}</h3>
                  <div className="gw-mt-2">
                    <Price amount={o.price} billing="one-time" />
                  </div>
                  <p className="gw-body gw-mt-2">{o.line}</p>
                  <ul className="gw-list gw-list--tight gw-mt-3">
                    {o.includes.slice(0, 5).map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                  <div className="gw-mt-3">
                    <BuyButton productId={o.id} label={o.primaryCta.label} size="md" variant={o.badge ? "primary" : "paper"} />
                  </div>
                  <p className="gw-small gw-muted gw-mt-2">
                    <Link className="gw-link" to={o.route}>
                      Everything included and excluded
                    </Link>{" "}
                    ·{" "}
                    <Link className="gw-link" to="/legal/licence">
                      Licence
                    </Link>{" "}
                    ·{" "}
                    <Link className="gw-link" to="/legal/refunds">
                      Refunds
                    </Link>
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="gw-section" id="addon" aria-labelledby="addon-title">
        <div className="gw-container">
          <div className="gw-split">
            <SectionHead eyebrow={`Add-on · ${offerAmount(OFFER.crm)} one-time`} title={<span id="addon-title">Embedded CRM.</span>} lead={`${OFFER.crm.outcome} ${OFFER.crm.priceNote} Standalone, or added to Built by Goodwork for a complete implementation of ${gbpRange(COMBINED.total, COMBINED.totalTo)} plus infrastructure. The server is expressly excluded.`}>
              <div className="gw-actions gw-mt-4">
                <Button to="/crm#enquire" arrow>
                  Discuss Your CRM
                </Button>
                <Button to="/crm" variant="secondary">
                  See CRM Features
                </Button>
              </div>
            </SectionHead>
            <Reveal variant="rise" delay={100}>
              <div className="gw-card">
                <ul className="gw-list gw-list--cols gw-list--tight">
                  {OFFER.crm.includes.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
                <hr className="gw-rule gw-mt-3" />
                <ul className="gw-list gw-list--x gw-list--tight gw-mt-3">
                  {OFFER.crm.excludes.slice(0, 3).map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="gw-section gw-surface" id="managed" aria-labelledby="managed-title">
        <div className="gw-container">
          <SectionHead eyebrow="Monthly · optional" title={<span id="managed-title">Managed infrastructure.</span>} lead={OWNERSHIP_PRINCIPLE} />
          <div className="gw-mt-4">
            <ManagedPlans />
          </div>
        </div>
      </section>

      <section className="gw-section" aria-labelledby="licence-title">
        <div className="gw-container">
          <div className="gw-split">
            <SectionHead eyebrow="Before you buy" title={<span id="licence-title">The licence, readable.</span>} lead="These principles apply to every product. The full wording is marked for solicitor review and linked from every checkout." />
            <Reveal variant="rise" delay={100}>
              <ul className="gw-list">
                {LICENCE_PRINCIPLES.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              <p className="gw-small gw-mt-3">
                <Link className="gw-link" to="/legal/licence">Commercial licence</Link> · <Link className="gw-link" to="/legal/refunds">Refund policy</Link> · <Link className="gw-link" to="/legal/terms">Terms</Link>
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="gw-section gw-surface" aria-labelledby="faq-title">
        <div className="gw-container">
          <SectionHead eyebrow="Questions" title={<span id="faq-title">Pricing questions, answered straight.</span>} />
          <div className="gw-mt-4">
            <FaqList items={FAQ} />
          </div>
        </div>
      </section>
    </>
  );
}
