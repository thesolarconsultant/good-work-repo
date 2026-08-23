import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import Headline from "../components/Headline";
import Reveal from "../components/Reveal";
import ShaderField from "../components/ShaderField";
import Seo from "../components/Seo";
import { SITE_URL } from "../lib/site";
import Shot from "../components/Shot";
import Stat from "../components/Stat";
import { CASE_STUDIES } from "../data/caseStudies";

const SCHEMA = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "GOOD WORK. case studies",
  url: `${SITE_URL}/case-studies`,
  itemListElement: CASE_STUDIES.map((cs, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "CreativeWork",
      name: cs.name,
      description: cs.lede,
      url: `${SITE_URL}/case-studies#${cs.id}`,
      about: cs.sector,
    },
  })),
};

export default function CaseStudies() {
  return (
    <>
      <Seo
        title="Case studies"
        description="Two UK energy businesses, two very different problems. Real screenshots of the sites, portals and content systems we built — and what each one had to solve."
        schema={SCHEMA}
      />

      <header className="gw-section--tight gw-hero" style={{ paddingTop: "clamp(2.5rem,6vw,4rem)" }}>
        <div className="gw-aurora" aria-hidden="true">
          <span /><span /><span /><span />
        </div>
        <ShaderField />
        <div className="gw-container">
          <p className="gw-label gw-pulse">Case studies</p>
          <Headline
            onMount
            className="gw-h1 gw-stack-md"
            lines={["What we've built", <>for people<span className="gw-dot" /></>]}
          />
          <Reveal variant="rise" delay={240}>
            <p className="gw-body-large gw-max-copy gw-text-muted gw-stack-md">
              Two energy businesses, two very different problems. Every screenshot below is the
              real site, and every claim is something you can go and click on.
            </p>
          </Reveal>
        </div>
      </header>

      <hr className="gw-rule--gradient" style={{ border: 0 }} />

      {CASE_STUDIES.map((cs, i) => (
        <div key={cs.id}>
          <section className={`gw-section${i % 2 === 1 ? " gw-dark" : ""}`} id={cs.id}>
            <div className="gw-container">
              <Reveal variant="rise">
                <div className="gw-case-head">
                  <div className="gw-case-accent" style={{ background: cs.accent }} aria-hidden="true" />
                  <div>
                    <p className="gw-label">{cs.sector}</p>
                    <h2 className="gw-h2" style={{ marginTop: 6 }}>{cs.name}</h2>
                    <p className="gw-case-site">
                      {cs.site} <span aria-hidden="true">·</span> {cs.tag}
                    </p>
                  </div>
                </div>
              </Reveal>

              <Reveal variant="rise" delay={90}>
                <p className="gw-body-large gw-max-copy gw-stack-lg">{cs.lede}</p>
              </Reveal>

              <div className="gw-facts">
                {cs.facts.map((f, n) => (
                  <Stat key={f.label} figure={f.figure} label={f.label} delay={n * 110} />
                ))}
              </div>

              <Shot
                src={cs.shots[0].src}
                alt={`${cs.name} — ${cs.shots[0].caption}`}
                caption={cs.shots[0].caption}
                className="gw-shot--lead"
                priority={i === 0}
              />

              <div className="gw-case-body">
                <Reveal variant="rise">
                  <p className="gw-label" style={{ marginBottom: 10 }}>The brief</p>
                  {cs.brief.map((p, idx) => (
                    <p className="gw-body gw-text-muted" style={{ marginBottom: 12 }} key={idx}>
                      {p}
                    </p>
                  ))}
                </Reveal>
                <Reveal variant="rise" delay={110}>
                  <p className="gw-label" style={{ marginBottom: 10 }}>What we built</p>
                  <ul className="gw-features gw-features--detail gw-features--single">
                    {cs.built.map((b) => (
                      <li key={b.title}>
                        <strong>{b.title}</strong>
                        <span>{b.desc}</span>
                      </li>
                    ))}
                  </ul>
                </Reveal>
              </div>

              <div className="gw-shot-grid">
                {cs.shots.slice(1).map((s) => (
                  <Shot
                    key={s.src}
                    src={s.src}
                    alt={`${cs.name} — ${s.caption}`}
                    caption={s.caption}
                    sizes="(max-width: 720px) 100vw, 520px"
                  />
                ))}
              </div>

              <Reveal variant="rise">
                <div className="gw-chips">
                  <p className="gw-label" style={{ width: "100%", marginBottom: 4 }}>Services used</p>
                  {cs.services.map((s) => (
                    <Link className="gw-chip" to="/services" key={s}>
                      {s}
                    </Link>
                  ))}
                </div>
              </Reveal>
            </div>
          </section>
          {i < CASE_STUDIES.length - 1 && (
            <hr className="gw-rule" style={{ maxWidth: 1100, marginInline: "auto" }} />
          )}
        </div>
      ))}

      <Footer statement="This could be your project next" />
    </>
  );
}
