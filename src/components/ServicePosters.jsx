import { Link } from "react-router-dom";
import Button from "./Button";
import Reveal from "./Reveal";
import OfferIcon from "./OfferIcon";
import { OFFER } from "../data/offers";
import { gbp, offerAmount } from "../lib/format";

// On the black poster, "primary" resolves to a white button (dark tokens).
const POSTERS = [
  { offer: OFFER.built, tone: "ink" },
  { offer: OFFER.crm, tone: "paper" },
  { offer: OFFER.agency, tone: "edge" },
];

/** How every service runs, from first conversation to the live system. */
const SERVICE_STEPS = [
  { title: "Scope", desc: "We agree what's built, the fixed fee and the boundaries, in writing, before anything starts." },
  { title: "Build", desc: "Goodwork builds it on the Studio system, customised and connected for your business." },
  { title: "Launch", desc: "Tested end to end, launched, and handed over so you own it." },
  { title: "Run", desc: "Run it yourself, or on a managed plan and Goodwork keeps it running." },
];

/** The three services as poster blocks: black, white, and gradient-edged. */
export default function ServicePosters({ timeline = true }) {
  return (
    <>
      <div className="gw-posters">
        {POSTERS.map(({ offer: o, tone }, i) => (
          <Reveal key={o.id} variant="rise" delay={i * 90} asChild>
            <article className={`gw-poster gw-poster--${tone}${tone === "ink" ? " gw-ondark" : ""}`} aria-labelledby={`poster-${o.id}`}>
              <OfferIcon id={o.id} />
              <h3 className="gw-poster__name" id={`poster-${o.id}`}>
                {o.name}
              </h3>
              <p className="gw-poster__price">
                {offerAmount(o)}
                <small>
                  one-time
                  {o.instalments ? ` · or ${o.instalments.count} × ${gbp(o.instalments.amount)}` : ""}
                </small>
              </p>
              <p className="gw-poster__line">{o.outcome}</p>
              <div className="gw-poster__foot">
                <Button to={o.primaryCta.to} arrow>
                  {o.primaryCta.label}
                </Button>
                <Link to={o.route} className="gw-poster__more">
                  Scope, inclusions and exclusions
                </Link>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
      {timeline && (
        <Reveal variant="rise">
          <ol className="gw-timeline" aria-label="How a service runs">
            {SERVICE_STEPS.map((s) => (
              <li key={s.title}>
                <b>{s.title}</b>
                <span>{s.desc}</span>
              </li>
            ))}
          </ol>
        </Reveal>
      )}
    </>
  );
}
