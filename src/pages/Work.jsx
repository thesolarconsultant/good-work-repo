import Button from "../components/Button";
import Footer from "../components/Footer";
import Headline from "../components/Headline";
import Reveal from "../components/Reveal";
import HorizontalWork from "../components/HorizontalWork";
import ShaderField from "../components/ShaderField";
import Seo from "../components/Seo";
import { SITE_URL } from "../lib/site";
import { CASE_STUDIES } from "../data/caseStudies";

const WORK = CASE_STUDIES.map((cs) => ({
  to: `/case-studies#${cs.id}`,
  name: cs.name,
  tag: cs.tag,
  site: cs.site,
  desc: cs.lede,
  shot: cs.shots[0].src,
  facts: cs.facts.slice(0, 2),
}));

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
        <ShaderField />
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

      <section className="gw-dark">
        <div className="gw-block__rule" />
        <div className="gw-rail-wrap">
          <HorizontalWork items={WORK} />
        </div>
      </section>

      <Footer statement="This could be your project next" />
    </>
  );
}
