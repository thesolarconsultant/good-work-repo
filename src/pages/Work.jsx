import Button from "../components/Button";
import Footer from "../components/Footer";
import Headline from "../components/Headline";
import Reveal from "../components/Reveal";
import Seo from "../components/Seo";
import { SITE_URL } from "../lib/site";
import Shot from "../components/Shot";
import Stat from "../components/Stat";
import { CASE_STUDIES } from "../data/caseStudies";

const SCHEMA = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Selected work — GOOD WORK.",
  url: `${SITE_URL}/work`,
  about: CASE_STUDIES.map((cs) => ({
    "@type": "CreativeWork",
    name: cs.name,
    description: cs.lede,
  })),
};

export default function Work() {
  return (
    <>
      <Seo
        title="Selected work"
        description="Brand, web and systems work for two UK energy businesses — The Solar Consultant and 8energy. Both live, both still running."
        schema={SCHEMA}
      />

      <header className="gw-section--tight gw-hero" style={{ paddingTop: "clamp(2.5rem,6vw,4rem)" }}>
        <div className="gw-aurora" aria-hidden="true">
          <span /><span /><span /><span />
        </div>
        <div className="gw-container">
          <p className="gw-label gw-pulse">Selected work</p>
          <Headline onMount className="gw-h1 gw-stack-md" lines={["Recent projects"]} />
          <Reveal variant="rise" delay={200}>
            <p className="gw-body-large gw-max-copy gw-text-muted gw-stack-md">
              Brand, web and systems work for two UK energy businesses — both live, both still
              running.
            </p>
          </Reveal>
          <Reveal variant="rise" delay={300}>
            <div className="gw-actions gw-stack-lg">
              <Button to="/case-studies" arrow>Read the case studies</Button>
            </div>
          </Reveal>
        </div>
      </header>

      {CASE_STUDIES.map((cs, i) => (
        <div key={cs.id}>
          <section className="gw-section" id={cs.id}>
            <div className="gw-container">
              <div className="gw-case-body" style={{ alignItems: "center" }}>
                <div style={{ order: i % 2 === 0 ? 1 : 2 }}>
                  <Shot
                    src={cs.shots[0].src}
                    alt={`${cs.name} homepage`}
                    sizes="(max-width: 860px) 100vw, 520px"
                    priority={i === 0}
                  />
                </div>
                <div style={{ order: i % 2 === 0 ? 2 : 1 }}>
                  <Reveal variant={i % 2 === 0 ? "right" : "left"}>
                    <span className="gw-work-card__tag">{cs.tag}</span>
                    <h2 className="gw-h2" style={{ marginTop: 6 }}>{cs.name}</h2>
                    <p className="gw-case-site">{cs.site}</p>
                    <p className="gw-body gw-text-muted gw-stack-md">{cs.lede}</p>
                  </Reveal>
                  <div className="gw-facts gw-facts--pair">
                    {cs.facts.slice(0, 2).map((f, n) => (
                      <Stat key={f.label} figure={f.figure} label={f.label} delay={n * 120} />
                    ))}
                  </div>
                  <Reveal variant="rise">
                    <Button to={`/case-studies#${cs.id}`} variant="outline" arrow>
                      See the full case study
                    </Button>
                  </Reveal>
                </div>
              </div>
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
