import { Link } from "react-router-dom";
import Button from "./Button";
import Reveal from "./Reveal";
import OfferIcon from "./OfferIcon";
import { LADDER, OFFER } from "../data/offers";
import { gbp, gbpRange, offerAmount } from "../lib/format";

/**
 * The four offers as a staircase: each step up is a bigger commitment and
 * more done for you, so each card stands taller than the last. On narrow
 * screens they become ordinary cards. The cards sit on CrmBand, which belongs
 * directly beneath them, outside the container.
 */
export default function OfferLadder() {
  return (
    <div className="gw-stairs">
      {LADDER.map((o, i) => (
        <Reveal key={o.id} variant="rise" delay={i * 80} asChild>
          <article className={`gw-stair${o.badge ? " gw-stair--featured" : ""}`} style={{ "--i": i }} aria-labelledby={`offer-${o.id}`}>
            <OfferIcon id={o.id} className="gw-offer-icon--lg" />
            <h3 className="gw-stair__name" id={`offer-${o.id}`}>
              {o.short}
            </h3>
            <p className="gw-stair__price">
              {offerAmount(o)}
              <span className="gw-sr-only"> one-time</span>
            </p>
            <p className="gw-stair__who">{o.who}</p>
            {o.badge && <p className="gw-stair__tag">{o.badge}</p>}
            {o.instalments && (
              <p className="gw-stair__note">
                or {o.instalments.count} payments of {gbp(o.instalments.amount)}
              </p>
            )}
            <div className="gw-stair__foot">
              <Button to={o.ladderCta.to} variant={o.badge ? "primary" : "secondary"} size="sm" arrow>
                {o.ladderCta.label}
              </Button>
              <Link to={o.route} className="gw-small gw-link">
                {o.kind === "product" ? "What's included" : "Scope and exclusions"}
              </Link>
            </div>
          </article>
        </Reveal>
      ))}
    </div>
  );
}

/** The CRM, as a band under the staircase: the four brand colours, then black. */
export function CrmBand() {
  const crm = OFFER.crm;
  return (
    <div className="gw-crmband">
      <div className="gw-crmband__rule" aria-hidden="true" />
      <div className="gw-crmband__body gw-ondark">
        <div className="gw-container gw-crmband__row">
          <OfferIcon id={crm.id} className="gw-offer-icon--lg" />
          <p className="gw-crmband__text">
            {crm.short}, {gbpRange(crm.price, crm.priceTo)}. Add it to any build.
            <small>Standalone, or with Built by Goodwork. The server is expressly excluded.</small>
          </p>
          <Button to={crm.primaryCta.to} arrow>
            {crm.primaryCta.label}
          </Button>
        </div>
      </div>
    </div>
  );
}
