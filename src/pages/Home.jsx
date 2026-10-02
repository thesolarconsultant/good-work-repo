import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Seo from "../components/Seo";
import Button from "../components/Button";
import Headline from "../components/Headline";
import Stamp from "../components/Stamp";
import Marquee from "../components/Marquee";
import Reveal from "../components/Reveal";
import SectionHead from "../components/SectionHead";
import OfferLadder, { CrmBand } from "../components/OfferLadder";
import ProductDeck from "../components/ProductDeck";
import PathChoice from "../components/PathChoice";
import StudioBento from "../components/StudioBento";
import ServicePosters from "../components/ServicePosters";
import ShowcasePanels from "../components/ShowcasePanels";
import StatementStrip from "../components/StatementStrip";
import ManagedPlans from "../components/ManagedPlans";
import FaqList from "../components/FaqList";
import LibraryGrid from "../components/LibraryGrid";
import Shot from "../components/Shot";
import { website, faqPage } from "../lib/schema";
import { gbp } from "../lib/format";
import { DESCRIPTION } from "../lib/site";
import { OFFER, FAQ, OWNERSHIP_PRINCIPLE } from "../data/offers";
import { ITEMS, CATEGORY_NAME, filterItems } from "../data/library";
import { FOUNDER } from "../data/founder";

const HOME_CATEGORIES = ["websites", "landing", "heroes", "pricing", "navigation", "forms", "dashboards", "content-systems", "agents", "crm"];

// What Goodwork builds, on the strip under the hero.
const TICKER = ["Website Library", "Goodwork Studio", "WhatsApp bots", "AI voice agents", "Content Console", "Embedded CRM", "Brand guidelines", "Automations", "Managed hosting"];

export default function Home() {
  return (
    <>
      <Seo title="Goodwork — Build better. Launch faster." description={DESCRIPTION} schema={[website(), faqPage(FAQ)]} />

      {/* Hero: what Goodwork builds, shown working. */}
      <header className="gw-hero2">
        <div className="gw-hero2__lead gw-ondark">
          <div className="gw-hero2__inner">
            <Headline onMount className="gw-hero2__title" lines={["The website.", "The agents.", "The system behind it."]} />
            <Reveal variant="fade" delay={360}>
              <span className="gw-hero2__rule" aria-hidden="true" />
            </Reveal>
            <Reveal variant="rise" delay={420}>
              <p className="gw-hero2__sub">Websites, AI agents and business systems, built around your business and owned by you for good.</p>
            </Reveal>
            <Reveal variant="rise" delay={500}>
              <div className="gw-hero2__actions">
                <Button to="/built-by-goodwork#enquire" size="lg" arrow>
                  Start your build
                </Button>
                <Link className="gw-hero2__alt" to="/library">
                  Or build it yourself, from {gbp(OFFER.library.price)}
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
        <div className="gw-hero2__stage">
          <ProductDeck />
        </div>
      </header>

      <Marquee items={TICKER} />

      {/* Two ways to work with Goodwork: build it yourself, or have it built. */}
      <section className="gw-section" aria-labelledby="paths">
        <div className="gw-container">
          <SectionHead eyebrow="Two ways to work with Goodwork" title={<span id="paths">Choose your path.</span>} lead="Both paths use the same Goodwork code and systems. The difference is who puts them together." />
          <div className="gw-mt-5">
            <PathChoice />
          </div>
        </div>
      </section>

      {/* The offers, as a staircase, on the CRM band. */}
      <section className="gw-section gw-section--flush" id="offers" aria-labelledby="ladder">
        <div className="gw-container">
          <SectionHead eyebrow="The offers" title={<span id="ladder">Start where you are. Move up when you need us.</span>} lead="Every product and service is paid once. Prices are the same everywhere on this site; what changes is who does the work." />
          <div className="gw-mt-5">
            <OfferLadder />
          </div>
        </div>
        <CrmBand />
      </section>

      {/* The Library, browsable from here. */}
      <LibraryPreviewSection />

      {/* Goodwork Studio: the systems, shown doing their jobs. */}
      <section className="gw-section gw-dark" aria-labelledby="studio-systems">
        <div className="gw-container">
          <div className="gw-pagehead__row">
            <SectionHead eyebrow={`Goodwork Studio · ${gbp(OFFER.studio.price)} one-time`} title={<span id="studio-systems">The system behind the website.</span>} lead={OFFER.studio.distinction} />
            <Reveal variant="rise" delay={120}>
              <Button to="/studio" arrow>
                See Goodwork Studio
              </Button>
            </Reveal>
          </div>
          <div className="gw-mt-4">
            <StudioBento />
          </div>
        </div>
      </section>

      {/* The services, as posters, and how each one runs. */}
      <section className="gw-section" aria-labelledby="services-home">
        <div className="gw-container">
          <SectionHead eyebrow="Services · we build it with you" title={<span id="services-home">Three ways Goodwork builds it with you.</span>} lead="Scoped in writing first, at a fixed fee, with the running costs kept visible." />
          <div className="gw-mt-4">
            <ServicePosters />
          </div>
        </div>
      </section>

      {/* Managed infrastructure */}
      <section className="gw-section gw-light" aria-labelledby="managed">
        <div className="gw-container">
          <SectionHead eyebrow="Managed infrastructure · optional · per month" title={<span id="managed">Own the build. Choose who runs it.</span>} lead="Run compatible Goodwork products on your own infrastructure, or ask us to host, monitor and maintain the live system. Variable messaging, calling and model usage stays visible instead of being hidden inside vague pricing.">
            <p className="gw-quote gw-mt-4 gw-max">{OWNERSHIP_PRINCIPLE}</p>
          </SectionHead>
          <div className="gw-mt-4">
            <ManagedPlans />
          </div>
        </div>
      </section>

      {/* Showcase: real projects on their devices, then the three promises. */}
      <section className="gw-section" aria-labelledby="showcase">
        <div className="gw-container">
          <Reveal variant="rise" className="gw-showcase-head">
            <p className="gw-eyebrow">Showcase · selected work</p>
            <h2 className="gw-h2 gw-mt-2" id="showcase">
              Real businesses, running on Goodwork.
            </h2>
          </Reveal>
          <div className="gw-mt-5">
            <ShowcasePanels />
          </div>
          <div className="gw-mt-5">
            <StatementStrip />
          </div>
          <Reveal variant="rise" className="gw-center gw-mt-4">
            <Button to="/showcase" variant="secondary" arrow>
              See the showcase
            </Button>
          </Reveal>
        </div>
      </section>

      {/* The sign-off: the line, as big as it goes, with the stamp. */}
      <section className="gw-section gw-bigclose" aria-labelledby="close-title">
        <div className="gw-container">
          <div className="gw-bigclose__row">
            <Reveal variant="rise">
              <h2 className="gw-bigclose__title" id="close-title">
                Build better.
                <br />
                Launch{" "}
                <span className="gw-nowrap">
                  <em className="gw-grad">faster</em>
                  <span className="gw-dot" aria-hidden="true" />
                </span>
              </h2>
            </Reveal>
            <Reveal variant="scale" delay={200} className="gw-bigclose__stamp">
              <Stamp size={150} />
            </Reveal>
          </div>
          <div className="gw-bigclose__foot">
            <p>
              Websites, AI agents and business systems. Use them yourself, or let us build it.
              <span className="gw-bigclose__how">How we work: understand, think, make, improve</span>
            </p>
            <div className="gw-actions">
              <Button to="/library" arrow>
                Explore the Library
              </Button>
              <Button to="/pricing" variant="secondary">
                Compare the offers
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 14. Founder-led */}
      <section className="gw-section gw-light" aria-labelledby="founder">
        <div className="gw-container">
          <div className="gw-founder">
            <Reveal variant="rise">
              <div className="gw-founder__media">
                {FOUNDER.video ? (
                  <div className="gw-shot__frame">
                    <video controls playsInline preload="metadata" poster={FOUNDER.videoPoster || undefined} src={FOUNDER.video} />
                  </div>
                ) : (
                  <Shot src={FOUNDER.image} alt={FOUNDER.imageAlt} sizes="(max-width: 860px) 100vw, 420px" />
                )}
                <span className="gw-founder__tag">
                  {FOUNDER.name} · {FOUNDER.role}
                </span>
              </div>
            </Reveal>
            <SectionHead eyebrow="Founder-led" title={<span id="founder">{FOUNDER.heading}</span>}>
              {FOUNDER.copy.map((p) => (
                <p key={p} className="gw-lead gw-max gw-mt-3">
                  {p}
                </p>
              ))}
              <p className="gw-small gw-muted gw-mt-3">{FOUNDER.note}</p>
              <div className="gw-actions gw-mt-4">
                <Button to="/learn" variant="secondary" arrow>
                  Read the build notes
                </Button>
              </div>
            </SectionHead>
          </div>
        </div>
      </section>

      {/* 15. FAQ */}
      <section className="gw-section" aria-labelledby="faq">
        <div className="gw-container">
          <div className="gw-split" style={{ "--gw-split": "minmax(0,0.7fr) minmax(0,1.3fr)" }}>
            <SectionHead eyebrow="Questions" title={<span id="faq">Straight answers.</span>} lead="Every answer here agrees with the pricing page and the licence. Where a policy is still with our solicitor, it says so." />
            <Reveal variant="rise" delay={100}>
              <FaqList items={FAQ} />
            </Reveal>
          </div>
        </div>
      </section>

      {/* 16. The final call to action is the footer's statement on this page. */}
    </>
  );
}

function LibraryPreviewSection() {
  const [category, setCategory] = useState("");
  const counts = useMemo(() => {
    const out = {};
    for (const it of ITEMS) out[it.category] = (out[it.category] || 0) + 1;
    return out;
  }, []);
  const items = useMemo(() => {
    const pool = filterItems(ITEMS, { category });
    // Lead with what previews live, then the rest, six at a time.
    return [...pool.filter((i) => i.featured), ...pool.filter((i) => !i.featured)].slice(0, 6);
  }, [category]);

  return (
    <section className="gw-section" aria-labelledby="lib-preview">
      <div className="gw-container">
        <div className="gw-pagehead__row">
          <SectionHead eyebrow="The Library" title={<span id="lib-preview">Start with something that already works.</span>} lead="Browse complete websites, individual sections and reusable business tools. Preview the experience, inspect what is included and choose the fastest route from idea to launch." />
          <Reveal variant="rise" delay={120}>
            <Button to={category ? `/library?category=${category}` : "/library"} variant="secondary" arrow>
              Browse the full Library
            </Button>
          </Reveal>
        </div>
        <Reveal variant="fade" className="gw-mt-4">
          <div className="gw-chips" role="group" aria-label="Preview a category">
            <button type="button" className={`gw-chip${!category ? " gw-chip--on" : ""}`} aria-pressed={!category} onClick={() => setCategory("")}>
              Featured
            </button>
            {HOME_CATEGORIES.map((c) => (
              <button key={c} type="button" className={`gw-chip${category === c ? " gw-chip--on" : ""}`} aria-pressed={category === c} onClick={() => setCategory(c)}>
                {CATEGORY_NAME[c]}
                <span className="gw-chip__n">{counts[c] || 0}</span>
              </button>
            ))}
          </div>
        </Reveal>
        <div className="gw-mt-3">
          <LibraryGrid items={items} eagerCount={0} onReset={() => setCategory("")} />
        </div>
      </div>
    </section>
  );
}
