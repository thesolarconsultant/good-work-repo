import Button from "./Button";
import Price from "./Price";
import Reveal from "./Reveal";
import OfferIcon from "./OfferIcon";
import { MANAGED_PLANS, CRM_RUNNING, COACHING, FAIR_USE, SELF_HOST_NOTE } from "../data/offers";
import { gbp } from "../lib/format";

/**
 * The four monthly plans side by side, then what sits around them: the CRM
 * add-on, the coaching programme (priced to scope, so no figure) and the
 * credit statement.
 */
export default function ManagedPlans({ cta = true }) {
  return (
    <>
      <div className="gw-plans">
        {MANAGED_PLANS.map((p, i) => (
          <Reveal key={p.id} variant="rise" delay={i * 60} asChild>
            <article className="gw-plan" aria-labelledby={`plan-${p.id}`}>
              <div>
                <OfferIcon id={p.id} />
                <h3 className="gw-plan__name gw-mt-2" id={`plan-${p.id}`}>
                  {p.name}
                </h3>
                <p className="gw-plan__for">{p.for}</p>
              </div>
              <Price amount={p.price} billing="monthly" />
              <ul className="gw-list gw-list--tight">
                {p.includes.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
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
        <div className="gw-plan-extras">
          <div className="gw-plan-extra">
            <OfferIcon id={CRM_RUNNING.id} />
            <div>
              <p className="gw-plan__name">Running your CRM too?</p>
              <p className="gw-plan__for gw-mt-1">
                Add {gbp(CRM_RUNNING.price)} per month to any plan and Goodwork runs the Embedded CRM as well.
              </p>
            </div>
          </div>
          <div className="gw-plan-extra">
            <OfferIcon id={COACHING.id} />
            <div>
              <p className="gw-plan__name">
                {COACHING.name} <span className="gw-plan__scope">· {COACHING.priceNote}</span>
              </p>
              <p className="gw-plan__for gw-mt-1">
                {COACHING.for} {COACHING.scope}
              </p>
              {cta && (
                <div className="gw-mt-2">
                  <Button to={`/contact?topic=managed&plan=${COACHING.id}`} variant="secondary" size="sm" arrow>
                    Talk to us about coaching
                  </Button>
                </div>
              )}
            </div>
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
