import Button from "./Button";
import Price from "./Price";
import Reveal from "./Reveal";
import OfferIcon from "./OfferIcon";
import { MANAGED_PLANS, CRM_RUNNING, COACHING, FAIR_USE, SELF_HOST_NOTE } from "../data/offers";
import { gbp } from "../lib/format";

/**
 * The four monthly plans, two to a row, each listing everything it includes in
 * full (never "everything in" another plan), then what sits around them: the
 * CRM add-on, the coaching programme (priced to scope, so no figure) and the
 * credit statement.
 */
export default function ManagedPlans({ cta = true }) {
  return (
    <>
      <div className="gw-plans">
        {MANAGED_PLANS.map((p, i) => (
          <Reveal key={p.id} variant="rise" delay={i * 60} asChild>
            <article className={`gw-plan${p.featured ? " gw-plan--featured" : ""}`} aria-labelledby={`plan-${p.id}`}>
              <div>
                <OfferIcon id={p.id} />
                <h3 className="gw-plan__name gw-mt-2" id={`plan-${p.id}`}>
                  {p.name}
                  {p.tag && <span className="gw-plan__tag">{p.tag}</span>}
                </h3>
                <p className="gw-plan__for">{p.for}</p>
              </div>
              <Price amount={p.price} billing="monthly" />
              <div className="gw-plan__groups">
                {p.groups.map((g) => (
                  <div key={g.title} className="gw-plan__group">
                    <p className="gw-plan__group-title">{g.title}</p>
                    <ul className="gw-list gw-list--tight">
                      {g.items.map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              {cta && (
                <div style={{ marginTop: "auto", paddingTop: "0.5rem" }}>
                  <Button to={`/contact?topic=managed&plan=${p.id}`} variant="secondary" size="sm" block>
                    Ask about {p.name}
                  </Button>
                </div>
              )}
            </article>
          </Reveal>
        ))}
      </div>
      <Reveal variant="rise" className="gw-mt-3">
        <div className="gw-plan-bands">
          <div className="gw-plan-band">
            <OfferIcon id={CRM_RUNNING.id} />
            <p className="gw-plan-band__text">
              <b>Running your CRM too?</b> <span>Add {gbp(CRM_RUNNING.price)} per month to any plan and Goodwork runs the Embedded CRM as well.</span>
            </p>
          </div>
          <div className="gw-plan-band">
            <OfferIcon id={COACHING.id} />
            <p className="gw-plan-band__text">
              <b>
                {COACHING.name}: {COACHING.priceNote.toLowerCase()}.
              </b>{" "}
              <span>
                {COACHING.for} {COACHING.scope}
              </span>
            </p>
            {cta && (
              <Button to={`/contact?topic=managed&plan=${COACHING.id}`} variant="secondary" size="sm" arrow>
                Talk to us about coaching
              </Button>
            )}
          </div>
        </div>
      </Reveal>
      <Reveal variant="rise" className="gw-mt-3">
        <div className="gw-fairuse">
          <strong>Credit and variable usage</strong>
          {FAIR_USE}
        </div>
        <p className="gw-small gw-muted gw-mt-2 gw-max">{SELF_HOST_NOTE}</p>
      </Reveal>
    </>
  );
}
