import Button from "./Button";
import Price from "./Price";
import Reveal from "./Reveal";
import { MANAGED_PLANS, FAIR_USE, SELF_HOST_NOTE } from "../data/offers";

/** The four monthly plans as a clean comparison, with the fair-use statement right beneath. */
export default function ManagedPlans({ cta = true }) {
  return (
    <>
      <div className="gw-plans">
        {MANAGED_PLANS.map((p, i) => (
          <Reveal key={p.id} variant="rise" delay={i * 60} asChild>
            <article className="gw-plan" aria-labelledby={`plan-${p.id}`}>
              <div>
                <h3 className="gw-plan__name" id={`plan-${p.id}`}>
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
        <div className="gw-fairuse">
          <strong>Variable usage and fair use</strong>
          {FAIR_USE}
        </div>
        <p className="gw-small gw-muted gw-mt-2 gw-max">{SELF_HOST_NOTE}</p>
      </Reveal>
    </>
  );
}
