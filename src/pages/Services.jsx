import Button from "../components/Button";
import Display from "../components/Display";
import Footer from "../components/Footer";
import Headline from "../components/Headline";
import Reveal from "../components/Reveal";
import ShaderField from "../components/ShaderField";
import Seo from "../components/Seo";
import { SITE_URL } from "../lib/site";
import ScopeBuilder from "../components/ScopeBuilder";
import Stamp from "../components/Stamp";
import { SERVICES } from "../data/services";

const CONSOLE_MODULES = SERVICES.filter((s) => s.category === "Content Console" && s.id !== "console");

const PROCESS = [
  { mark: "1", title: "Understand", desc: "A call to work out how you actually win jobs today, where enquiries come from, and what's leaking. No questionnaire, no discovery invoice." },
  { mark: "2", title: "Think", desc: "We come back with a scope and a fixed price — what gets built, what it costs to run, and what it should change. Nothing starts until you've agreed it." },
  { mark: "3", title: "Make", desc: "Built in weeks, not quarters. You see it as it goes, and it doesn't go live until it's verified — links, forms, tracking, the lot." },
  { mark: "4", title: "Improve", desc: "Where there's a monthly element, the work continues after launch: content going out, ads managed, systems watched, and a report you can read in two minutes." },
];

const SCHEMA = {
  "@context": "https://schema.org",
  "@type": "OfferCatalog",
  name: "GOOD WORK. services",
  url: `${SITE_URL}/services`,
  provider: { "@id": `${SITE_URL}/#organisation` },
  itemListElement: SERVICES.map((s) => ({
    "@type": "Offer",
    itemOffered: { "@type": "Service", name: s.name, description: s.note, category: s.category },
  })),
};

export default function Services() {
  return (
    <>
      <Seo
        title="Services"
        description="Brand identity, hand-built websites, CRM, booking, quoting, automation and the Content Console. Pick what you need and we'll scope it at a fixed price."
        schema={SCHEMA}
      />

      <header className="gw-section--tight gw-hero" style={{ paddingTop: "clamp(2.5rem,6vw,4rem)" }}>
        <div className="gw-aurora" aria-hidden="true">
          <span /><span /><span /><span />
        </div>
        <ShaderField />
        <div className="gw-container">
          <p className="gw-label gw-pulse">Services</p>
          <Headline
            onMount
            className="gw-h1 gw-stack-md"
            lines={["Brand. Websites.", <>Systems<span className="gw-dot" /></>]}
          />
          <Reveal variant="rise" delay={240}>
            <p className="gw-body-large gw-max-copy gw-text-muted gw-stack-md">
              Everything a business needs to look and work better — built properly, and kept
              running after launch. Take one thing or the lot.
            </p>
          </Reveal>
        </div>
      </header>

      <hr className="gw-rule--gradient" style={{ border: 0 }} />

      <ScopeBuilder />

      <section className="gw-dark">
        {/* The rule sits outside the padded block so it lands on the edge. */}
        <div className="gw-block__rule" />
        <div className="gw-block">
          <div className="gw-container">
          <Reveal variant="rise">
            <div className="gw-approved" style={{ marginBottom: 28 }}>
              <Stamp size={120} />
              <div>
                <p className="gw-label">A closer look</p>
                <Display>The Content<br />Console</Display>
              </div>
            </div>
            <p className="gw-body-large gw-max-copy" style={{ marginBottom: 16 }}>
              One dashboard that keeps a business looking active, without anyone sitting down to
              write it.
            </p>
            <p className="gw-body gw-max-copy" style={{ marginBottom: 8 }}>
              Most small businesses go quiet online not because they don't see the point, but
              because writing posts comes last after a full day on site. The Console does the
              drafting from what you've already told us about the business — you review it, change
              what you want, and schedule it. Ten minutes a week instead of an agency retainer.
            </p>
          </Reveal>
          <ul className="gw-features gw-features--detail">
            {CONSOLE_MODULES.map((m, i) => (
              <Reveal key={m.id} variant="rise" delay={Math.min(i * 70, 280)} asChild>
                <li>
                  <strong>{m.name}</strong>
                  <span>{m.note}</span>
                </li>
              </Reveal>
            ))}
          </ul>
          <Reveal variant="rise">
            <div className="gw-actions gw-stack-lg">
              <Button to="/content-console" variant="light" arrow>
                See the full Content Console
              </Button>
            </div>
          </Reveal>
        </div>
        </div>
      </section>

      <section className="gw-section">
        <div className="gw-container">
          <Reveal variant="rise">
            <p className="gw-label">How it runs</p>
            <h2 className="gw-display gw-stack-sm">What actually<br />happens</h2>
            <p className="gw-body gw-max-copy gw-text-muted gw-stack-sm">
              Four steps, no agency theatre. You'll know the scope and the price before we start
              building.
            </p>
          </Reveal>
          <div className="gw-stack-lg">
            {PROCESS.map((p, i) => (
              <Reveal key={p.mark} variant="left" delay={i * 90} asChild>
                <div className="gw-addon">
                  <div className="gw-addon-mark">{p.mark}</div>
                  <div className="gw-addon-body">
                    <strong>{p.title}</strong>
                    <span>{p.desc}</span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Footer statement="Make your business look as good as it actually is" />
    </>
  );
}
