import Button from "./Button";
import Reveal from "./Reveal";
import OfferIcon from "./OfferIcon";
import { PATHS } from "../data/offers";
import { gbp } from "../lib/format";

/**
 * "Choose your path": the two ways to work with Goodwork side by side. Build
 * it yourself, or have Goodwork build it; each says what that path gives you
 * and where its prices start.
 */
export default function PathChoice() {
  return (
    <div className="gw-paths">
      {PATHS.map((p, i) => (
        <Reveal key={p.id} variant="rise" delay={i * 90} asChild>
          <article className={`gw-path gw-path--${p.id}${p.id === "dfy" ? " gw-ondark" : ""}`} aria-labelledby={`path-${p.id}`}>
            <div className="gw-path__icons">
              {p.icons.map((id) => (
                <OfferIcon key={id} id={id} />
              ))}
            </div>
            <p className="gw-path__step">
              {p.step} · {p.who}
            </p>
            <h3 className="gw-path__title" id={`path-${p.id}`}>
              {p.title}
            </h3>
            <p className="gw-path__line">{p.line}</p>
            <ul className="gw-list gw-path__points">
              {p.points.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <p className="gw-path__from">
              From <b>{gbp(p.from)}</b> one-time
            </p>
            <div className="gw-path__actions">
              <Button to={p.primary.to} arrow>
                {p.primary.label}
              </Button>
              <Button to={p.secondary.to} variant="secondary">
                {p.secondary.label}
              </Button>
            </div>
          </article>
        </Reveal>
      ))}
    </div>
  );
}
