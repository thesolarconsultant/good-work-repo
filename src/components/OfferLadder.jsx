import { Link } from "react-router-dom";
import Button from "./Button";
import Price from "./Price";
import Reveal from "./Reveal";
import OfferIcon from "./OfferIcon";
import { LADDER, OFFER, COMBINED } from "../data/offers";
import { gbp, gbpRange, offerAmount } from "../lib/format";

export function OfferCard({ offer, cta = "ladder", delay = 0 }) {
  const action = cta === "primary" ? offer.primaryCta : offer.ladderCta;
  return (
    <Reveal variant="rise" delay={delay} asChild>
      <article className={`gw-offer${offer.badge ? " gw-offer--featured" : ""}`} aria-labelledby={`offer-${offer.id}`}>
        <div className="gw-offer__top">
          <span className="gw-offer__who">
            <OfferIcon id={offer.id} />
            {offer.who}
          </span>
          {offer.badge && <span className="gw-badge gw-badge--solid">{offer.badge}</span>}
        </div>
        <div>
          <h3 className="gw-offer__name" id={`offer-${offer.id}`}>
            {offer.short}
          </h3>
          <div className="gw-mt-2">
            <Price amount={offer.price} to={offer.priceTo} billing={offer.billing} />
          </div>
          {offer.instalments && (
            <p className="gw-offer__note gw-mt-1">
              or {offer.instalments.count} payments of {gbp(offer.instalments.amount)}, {offer.instalments.note}
            </p>
          )}
        </div>
        <p className="gw-offer__copy">{offer.ladder}</p>
        <div className="gw-offer__foot">
          <Button to={action.to} variant={offer.badge ? "primary" : "secondary"} arrow>
            {action.label}
          </Button>
          <Link to={offer.route} className="gw-small gw-link">
            {offer.kind === "product" ? "What's included and excluded" : "Scope and exclusions"}
          </Link>
        </div>
      </article>
    </Reveal>
  );
}

/** The four primary cards, then the CRM as an add-on with the combined value. */
export default function OfferLadder({ showAddon = true }) {
  const crm = OFFER.crm;
  return (
    <>
      <div className="gw-ladder">
        {LADDER.map((o, i) => (
          <OfferCard key={o.id} offer={o} delay={i * 70} />
        ))}
      </div>
      {showAddon && (
        <Reveal variant="rise" className="gw-mt-3">
          <div className="gw-addon">
            <div>
              <span className="gw-offer__who">
                <OfferIcon id={crm.id} />
                Powerful add-on · {crm.who}
              </span>
              <h3 className="gw-offer__name gw-mt-1">{crm.name}</h3>
              <p className="gw-offer__copy gw-mt-2">{crm.outcome} Standalone, or added to Built by Goodwork. The server is expressly excluded.</p>
            </div>
            <div className="gw-sum" aria-label="Combined order value">
              <div>
                <span>{OFFER.built.name}</span>
                <span>{gbp(OFFER.built.price)}</span>
              </div>
              <div>
                <span>{crm.short}</span>
                <span>{offerAmount(crm)}</span>
              </div>
              <div>
                <span>
                  {COMBINED.label}
                  <br />
                  <small>{COMBINED.note}</small>
                </span>
                <span>{gbpRange(COMBINED.total, COMBINED.totalTo)}</span>
              </div>
            </div>
            <div className="gw-actions" style={{ flexDirection: "column", alignItems: "stretch" }}>
              <Price amount={crm.price} to={crm.priceTo} billing={crm.billing} />
              <Button to={crm.primaryCta.to} variant="secondary" arrow>
                {crm.primaryCta.label}
              </Button>
              <Link to={crm.secondaryCta.to} className="gw-small gw-link">
                {crm.secondaryCta.label}
              </Link>
            </div>
          </div>
        </Reveal>
      )}
    </>
  );
}
