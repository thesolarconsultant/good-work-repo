import { Link, useParams } from "react-router-dom";
import Seo from "../components/Seo";
import PageHeader from "../components/PageHeader";
import SectionHead from "../components/SectionHead";
import Reveal from "../components/Reveal";
import Button from "../components/Button";
import Shot from "../components/Shot";
import PhoneStory from "../components/PhoneStory";
import BrollStudio from "../components/BrollStudio";
import NotFound from "./NotFound";
import { SYSTEM, SYSTEMS } from "../data/systems";
import { OFFER } from "../data/offers";
import { CONSOLE_SECTIONS, ENGINE_SECTIONS } from "../data/console";
import { TSC_AGENT_SCRIPT } from "../data/agentScripts";
import { breadcrumbs } from "../lib/schema";
import { gbp } from "../lib/format";

function ConsoleSection({ s, index }) {
  return (
    <div className="gw-show" id={s.id}>
      <Reveal variant="rise">
        <p className="gw-eyebrow">{s.kicker}</p>
        <h3 className="gw-h3 gw-mt-2">{s.title}</h3>
        <p className="gw-body gw-mt-3">{s.does}</p>
        <div className="gw-quote gw-mt-3" style={{ fontSize: "1rem", fontWeight: 400, color: "var(--gw-text-2)" }}>
          <span className="gw-eyebrow gw-eyebrow--accent" style={{ display: "block", marginBottom: "0.4rem" }}>
            Why it matters
          </span>
          {s.great}
        </div>
      </Reveal>
      {s.shot ? (
        <Shot src={s.shot.src} alt={s.shot.caption} caption={s.shot.caption} sizes="(max-width: 900px) 100vw, 560px" priority={index === 0} />
      ) : (
        <div />
      )}
    </div>
  );
}

export default function SystemPage() {
  const { slug } = useParams();
  const sys = SYSTEM[slug];
  if (!sys) return <NotFound />;

  const crumbs = [{ label: "Home", to: "/" }, { label: "Systems", to: "/systems" }, { label: sys.name }];
  const others = SYSTEMS.filter((s) => s.slug !== sys.slug);

  return (
    <>
      <Seo title={`${sys.name} — ${sys.outcome}`} description={sys.summary} schema={breadcrumbs(crumbs)} />

      <PageHeader
        crumbs={crumbs}
        eyebrow={sys.eyebrow}
        lines={[sys.name]}
        lead={sys.outcome}
        aside={
          <div className="gw-card" style={{ minWidth: 300 }}>
            <span className="gw-badge gw-badge--studio">Included in Goodwork Studio</span>
            <p className="gw-h4 gw-mt-3">{gbp(OFFER.studio.price)} one-time, self-build</p>
            <p className="gw-small gw-muted gw-mt-1">{OFFER.studio.distinction}</p>
            {sys.managed && <p className="gw-small gw-mt-2">{sys.managed}</p>}
            <div className="gw-actions gw-mt-3" style={{ flexDirection: "column", alignItems: "stretch" }}>
              {sys.ctas.map((c) => (
                <Button key={c.label} to={c.to} variant={c.variant || "primary"} arrow={!c.variant}>
                  {c.label}
                </Button>
              ))}
            </div>
          </div>
        }
      >
        <p className="gw-body gw-max">{sys.summary}</p>
      </PageHeader>

      <section className="gw-section--tight" aria-labelledby="receive-title">
        <div className="gw-container">
          <div className="gw-inc">
            <div className="gw-inc__col">
              <div className="gw-inc__head">
                <h2 className="gw-h4" id="receive-title">
                  What you receive
                </h2>
                <span className="gw-badge gw-badge--studio">Studio</span>
              </div>
              <ul className="gw-list">
                {sys.receive.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div className="gw-inc__col gw-inc__col--x">
              <div className="gw-inc__head">
                <h2 className="gw-h4">What you need, and pay for, separately</h2>
                <span className="gw-badge gw-badge--muted">Not included</span>
              </div>
              <ul className="gw-list gw-list--x">
                {sys.needs.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              <p className="gw-small gw-muted gw-mt-3">
                Variable usage is billed by the providers, or sits inside a fair-use allowance on a <Link className="gw-link" to="/managed">managed plan</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {sys.showPhoneDemo && (
        <section className="gw-section gw-surface" aria-labelledby="demo-title">
          <div className="gw-container">
            <h2 className="gw-sr-only" id="demo-title">
              Illustrative conversation
            </h2>
            <PhoneStory kicker="Illustrative flow" title="Qualified and booked before anyone picks up." intro="The shape of an enquiry landing on a WhatsApp bot built on this system: the questions it asks and the call it books. An illustrative conversation, not a captured transcript." contact={TSC_AGENT_SCRIPT.contact} subtitle="WhatsApp bot" messages={TSC_AGENT_SCRIPT.messages} />
          </div>
        </section>
      )}

      {sys.journey && (
        <section className="gw-section gw-surface" aria-labelledby="journey-title">
          <div className="gw-container">
            <SectionHead eyebrow="Illustrative call" title={<span id="journey-title">How a call runs.</span>} lead="A defined journey with hand-off rules. Illustrative, not a recording." />
            <div className="gw-vig gw-mt-4" style={{ maxWidth: 720 }}>
              {sys.journey.map((line, i) => (
                <div key={i} className={`gw-vig__bubble${line.who === "Agent" ? " gw-vig__bubble--out" : ""}`}>
                  <span className="gw-eyebrow" style={{ display: "block", marginBottom: 4, color: line.who === "Agent" ? "rgba(255,255,255,0.75)" : undefined }}>
                    {line.who}
                  </span>
                  {line.text}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {sys.showConsoleSections && (
        <>
          <section className="gw-section" aria-labelledby="console-title">
            <div className="gw-container">
              <SectionHead eyebrow="The console, screen by screen" title={<span id="console-title">Built and running for clients.</span>} lead="The screenshots are consoles Goodwork built for The Solar Consultant and 8energy. Every claim is something those consoles do." />
              <div className="gw-mt-4">
                {CONSOLE_SECTIONS.map((s, i) => (
                  <ConsoleSection key={s.id} s={s} index={i} />
                ))}
              </div>
            </div>
          </section>
          <section className="gw-section gw-surface" aria-labelledby="engine-title">
            <div className="gw-container">
              <SectionHead eyebrow="The engine behind it" title={<span id="engine-title">Nothing publishes until the data survives a check.</span>} />
              <div className="gw-mt-4">
                {ENGINE_SECTIONS.map((s) => (
                  <div key={s.id}>
                    <ConsoleSection s={s} />
                    {/* The live Higgsfield panel probes /api/broll on mount, so it only
                        renders when the deployment has opted in. */}
                    {s.id === "broll" && import.meta.env.VITE_BROLL_ENABLED === "1" && <BrollStudio />}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      <section className="gw-section" aria-labelledby="others-title">
        <div className="gw-container">
          <SectionHead eyebrow="The other systems" title={<span id="others-title">Part of one toolkit.</span>} />
          <div className="gw-grid gw-grid--4 gw-mt-4">
            {others.map((s) => (
              <Link key={s.slug} to={`/systems/${s.slug}`} className="gw-feature">
                <p className="gw-eyebrow">{s.eyebrow}</p>
                <h3 className="gw-h4">{s.name}</h3>
                <p className="gw-small gw-body">{s.outcome}</p>
                <span className="gw-feature__go">See the system →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
