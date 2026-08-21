import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import Button from "../components/Button";
import Headline from "../components/Headline";
import GlowCard from "../components/GlowCard";
import Marquee from "../components/Marquee";
import Reveal from "../components/Reveal";
import Seo from "../components/Seo";
import { SITE_URL } from "../lib/site";
import Shot from "../components/Shot";
import Stamp from "../components/Stamp";
import { CASE_STUDIES } from "../data/caseStudies";

const WORK = CASE_STUDIES.map((cs) => ({
  to: `/case-studies#${cs.id}`,
  name: cs.name,
  tag: cs.tag,
  desc: cs.lede,
  shot: cs.shots[0].src,
}));

const DISCIPLINES = [
  { mark: "1", title: "Brand", desc: "Identity, positioning and messaging that make a business instantly recognisable." },
  { mark: "2", title: "Web", desc: "Websites and digital experiences built around one job: commercial outcomes." },
  { mark: "3", title: "Creative", desc: "Campaigns, content and advertising that actually gets looked at." },
  { mark: "4", title: "Systems", desc: "CRM, booking, quoting and content infrastructure that runs without you." },
];

const TICKER = [
  "Brand identity",
  "Websites",
  "Content Console",
  "Open CRM",
  "Booking systems",
  "Meta ads",
  "AI agents",
  "Quoting apps",
  "WhatsApp automation",
];

const SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "GOOD WORK.",
  url: SITE_URL,
  publisher: { "@id": `${SITE_URL}/#organisation` },
};

export default function Home() {
  return (
    <>
      <Seo
        title="GOOD WORK. — Brand, websites and systems for UK businesses"
        description="A creative agency that makes businesses look and work better. Brand identity, hand-built websites, and the systems that keep enquiries, content and quoting running after launch."
        schema={SCHEMA}
      />

      <header className="gw-section gw-hero" style={{ paddingTop: "clamp(3rem,8vw,6rem)" }}>
        <div className="gw-aurora" aria-hidden="true">
          <span /><span /><span /><span />
        </div>
        <div className="gw-container">
          <div className="gw-hero__grid">
            <div>
              <Reveal variant="fade">
                <p className="gw-label gw-pulse">Brand · Web · Systems</p>
              </Reveal>
              <Headline
                onMount
                className="gw-h1 gw-stack-md"
                lines={[
                  "We make businesses",
                  <>
                    look and <em className="gw-grad">work better</em>
                    <span className="gw-dot" />
                  </>,
                ]}
              />
              <Reveal variant="rise" delay={260}>
                <p className="gw-body-large gw-max-copy gw-text-muted gw-stack-lg">
                  Good businesses get let down by weak websites, disconnected systems and
                  inconsistent marketing. We fix that — properly, once, then keep it running.
                </p>
              </Reveal>
              <Reveal variant="rise" delay={380}>
                <div className="gw-actions gw-stack-lg">
                  <Button to="/work" arrow>View our work</Button>
                  <Button to="/services" variant="outline">See services</Button>
                </div>
              </Reveal>
            </div>

            <Reveal variant="scale" delay={420} className="gw-hero__stamp">
              <Stamp size={168} />
            </Reveal>
          </div>
        </div>
      </header>

      <Marquee items={TICKER} />

      <section className="gw-section">
        <div className="gw-container">
          <Reveal variant="rise">
            <p className="gw-label">What we do</p>
            <h2 className="gw-h2 gw-stack-sm">Four disciplines. One standard.</h2>
          </Reveal>
          <div className="gw-grid gw-grid--2 gw-stack-lg">
            {DISCIPLINES.map((d, i) => (
              <Reveal key={d.title} variant="rise" delay={i * 90} asChild>
                <GlowCard>
                  <span className="gw-card__mark" aria-hidden="true">{d.mark}</span>
                  <h3 className="gw-h3">{d.title}</h3>
                  <p className="gw-body gw-text-muted gw-stack-sm">{d.desc}</p>
                </GlowCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="gw-section gw-dark">
        <div className="gw-container">
          <Reveal variant="rise">
            <p className="gw-label">Selected work</p>
            <h2 className="gw-h2 gw-stack-sm">Recent projects</h2>
          </Reveal>
          <div className="gw-work-grid gw-stack-lg">
            {WORK.map((w, i) => (
              <Reveal key={w.name} variant="rise" delay={i * 110} asChild>
                <Link to={w.to} className="gw-work-card gw-work-card--dark">
                  <div className="gw-work-card__media-wrap">
                    <Shot
                      src={w.shot}
                      alt={`${w.name} website`}
                      sizes="(max-width: 640px) 100vw, 520px"
                      parallax={false}
                      reveal={false}
                      className="gw-work-card__figure"
                    />
                    <span className="gw-work-card__scrim" aria-hidden="true" />
                  </div>
                  <div className="gw-work-card__body">
                    <span className="gw-work-card__tag">{w.tag}</span>
                    <p className="gw-body">{w.desc}</p>
                    <span className="gw-work-card__go">
                      Read the case study <span aria-hidden="true">→</span>
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
          <Reveal variant="rise">
            <Button to="/case-studies" variant="light" className="gw-stack-lg" arrow>
              Read the case studies
            </Button>
          </Reveal>
        </div>
      </section>

      <section className="gw-section">
        <div className="gw-container">
          <Reveal variant="rise">
            <div className="gw-approved">
              <Stamp size={120} />
              <div>
                <p className="gw-label">How we work</p>
                <h2 className="gw-h2 gw-stack-sm">Understand. Think. Make. Improve.</h2>
              </div>
            </div>
          </Reveal>
          <Reveal variant="rise" delay={120}>
            <p className="gw-body-large gw-max-copy gw-text-muted gw-stack-lg">
              No unnecessary agency process. We work out what matters, then we make it better —
              and keep making it better once it's live.
            </p>
          </Reveal>
        </div>
      </section>

      <Footer statement="Got something worth making better" />
    </>
  );
}
