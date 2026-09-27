import { Link } from "react-router-dom";
import Seo from "../components/Seo";
import PageHeader from "../components/PageHeader";
import SectionHead from "../components/SectionHead";
import Reveal from "../components/Reveal";
import Button from "../components/Button";
import Shot from "../components/Shot";
import PhoneStory from "../components/PhoneStory";
import { SHOWCASE, DEMOS } from "../data/showcase";
import { itemList, breadcrumbs } from "../lib/schema";

export default function Showcase() {
  const crumbs = [{ label: "Home", to: "/" }, { label: "Showcase" }];
  return (
    <>
      <Seo title="Showcase — live projects, templates and product demonstrations" description="Real projects built on the Goodwork system, with the original problem, what Goodwork created, which products were used and what you can preview. No fabricated results." schema={[itemList("Goodwork showcase", "/showcase", SHOWCASE.map((s) => ({ name: s.name }))), breadcrumbs(crumbs)]} />

      <PageHeader crumbs={crumbs} eyebrow="Showcase" lines={["Good work should", "be visible."]} lead="Live projects, completed builds and product demonstrations. Each entry says what the problem was, what Goodwork created, which systems it used and what you can open. Status labels are honest: live means live." />

      <section className="gw-section--tight" aria-labelledby="demos-title">
        <div className="gw-container">
          <SectionHead eyebrow="Product demonstrations" title={<span id="demos-title">Things you can open right now.</span>} />
          <div className="gw-grid gw-grid--3 gw-mt-4">
            {DEMOS.map((d, i) => (
              <Reveal key={d.id} variant="rise" delay={i * 60} asChild>
                <div className="gw-card" style={{ display: "grid", gap: "0.6rem" }}>
                  <span className="gw-eyebrow">{d.kind}</span>
                  <h3 className="gw-h4">{d.name}</h3>
                  <p className="gw-small gw-body">{d.copy}</p>
                  <div className="gw-mt-2">
                    {d.to ? (
                      <Button to={d.to} variant="secondary" size="sm" arrow>
                        {d.cta}
                      </Button>
                    ) : (
                      <Button href={d.href} variant="secondary" size="sm" arrow>
                        {d.cta}
                      </Button>
                    )}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="gw-section" aria-labelledby="work-title">
        <div className="gw-container">
          <SectionHead eyebrow="Completed work" title={<span id="work-title">Built on the system.</span>} lead="Written from what is in each client's repository. Screenshots are captures of the real sites." />
          <div className="gw-mt-4">
            {SHOWCASE.map((s, i) => (
              <article key={s.id} className="gw-show" id={s.id} aria-labelledby={`show-${s.id}`}>
                <div style={{ display: "grid", gap: "1rem", minWidth: 0 }}>
                  <Shot src={s.shots[0].src} alt={`${s.name} — ${s.shots[0].caption}`} caption={s.shots[0].caption} sizes="(max-width: 900px) 100vw, 640px" priority={i === 0} />
                  {s.shots.length > 1 && (
                    <div className="gw-shot-grid">
                      {s.shots.slice(1, 3).map((sh) => (
                        <Shot key={sh.src} src={sh.src} alt={`${s.name} — ${sh.caption}`} caption={sh.caption} sizes="(max-width: 640px) 100vw, 310px" />
                      ))}
                    </div>
                  )}
                </div>
                <div className="gw-show__meta">
                  <div>
                    <div className="gw-chips">
                      <span className={`gw-badge${s.status === "Live" ? " gw-badge--ok" : " gw-badge--muted"}`}>{s.status}</span>
                      <span className="gw-badge gw-badge--muted">{s.sector}</span>
                    </div>
                    <h3 className="gw-h2 gw-mt-3" id={`show-${s.id}`} style={{ fontSize: "clamp(1.5rem,2.8vw,2.2rem)" }}>
                      {s.name}
                    </h3>
                  </div>
                  <div className="gw-show__block">
                    <h4>The original problem</h4>
                    <p>{s.problem}</p>
                  </div>
                  <div className="gw-show__block">
                    <h4>What Goodwork created</h4>
                    <p>{s.created}</p>
                  </div>
                  <div className="gw-show__block">
                    <h4>Products and systems used</h4>
                    <div className="gw-chips">
                      {s.systems.map((x) => (
                        <span key={x} className="gw-chip" style={{ cursor: "default" }}>
                          {x}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="gw-show__block">
                    <h4>What you can preview</h4>
                    {s.preview ? (
                      <Button href={s.preview.href} variant="secondary" size="sm" arrow>
                        {s.preview.label}
                      </Button>
                    ) : (
                      <p>Not publicly live yet. The screenshots here are the build itself.</p>
                    )}
                  </div>
                  {s.demo === "agent" && (
                    <p className="gw-small gw-muted">
                      See the illustrative agent conversation on the <Link className="gw-link" to="/systems/whatsapp-bot">WhatsApp bot page</Link>.
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="gw-section gw-surface" aria-labelledby="agent-title">
        <div className="gw-container">
          <h2 className="gw-sr-only" id="agent-title">
            Agent demonstration
          </h2>
          <PhoneStory kicker="See it work" title="Booked without anyone picking up the phone." intro="The shape of a real enquiry landing on The Solar Consultant's AI booking agent: the questions it asks and the call it books before a person is involved. Illustrative, not a captured transcript." contact={SHOWCASE[0].agentScript.contact} subtitle={SHOWCASE[0].agentScript.subtitle} messages={SHOWCASE[0].agentScript.messages} />
        </div>
      </section>

      <section className="gw-section" aria-labelledby="next-title">
        <div className="gw-container gw-center">
          <SectionHead align="center" eyebrow="Your project" title={<span id="next-title">This could be your build next.</span>} lead="Start with the code, take the complete Studio toolkit or ask Goodwork to build the system with you.">
            <div className="gw-actions gw-mt-4" style={{ justifyContent: "center" }}>
              <Button to="/built-by-goodwork" arrow>
                Start Your Build
              </Button>
              <Button to="/library" variant="secondary">
                Explore the Library
              </Button>
            </div>
          </SectionHead>
        </div>
      </section>
    </>
  );
}
