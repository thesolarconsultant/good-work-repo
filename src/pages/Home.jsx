import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Seo from "../components/Seo";
import Button from "../components/Button";
import Headline from "../components/Headline";
import ShaderField from "../components/ShaderField";
import SparklesText from "../components/SparklesText";
import Stamp from "../components/Stamp";
import Marquee from "../components/Marquee";
import Display from "../components/Display";
import GlowCard from "../components/GlowCard";
import HorizontalWork from "../components/HorizontalWork";
import Reveal from "../components/Reveal";
import SectionHead from "../components/SectionHead";
import OfferLadder from "../components/OfferLadder";
import SystemJourney from "../components/SystemJourney";
import ManagedPlans from "../components/ManagedPlans";
import FaqList from "../components/FaqList";
import LibraryGrid from "../components/LibraryGrid";
import Price from "../components/Price";
import Shot from "../components/Shot";
import { website, faqPage } from "../lib/schema";
import { gbp } from "../lib/format";
import { DESCRIPTION } from "../lib/site";
import { OFFER, PROOF_LINE, TWO_WAYS, STUDIO_FEATURES, FAQ, OWNERSHIP_PRINCIPLE } from "../data/offers";
import { ITEMS, CATEGORY_NAME, filterItems } from "../data/library";
import { SHOWCASE } from "../data/showcase";
import { FOUNDER } from "../data/founder";

const HOME_CATEGORIES = ["websites", "landing", "heroes", "pricing", "navigation", "forms", "dashboards", "content-systems", "agents", "crm"];

// What Goodwork builds, on the strip under the hero.
const TICKER = ["Website Library", "Goodwork Studio", "WhatsApp bots", "AI voice agents", "Content Console", "Embedded CRM", "Brand guidelines", "Automations", "Managed hosting"];

// The showcase, travelling sideways as you scroll.
const WORK = SHOWCASE.map((s) => ({
  to: `/showcase#${s.id}`,
  name: s.name,
  tag: `${s.status} · ${s.tag}`,
  site: s.site,
  desc: s.lede,
  shot: s.shots[0].src,
}));

const ICONS = {
  "whatsapp-bot": <path d="M4 5h16v10H9l-5 4V5zM8 9h8M8 12h5" />,
  "voice-agent": <path d="M12 3v10M12 13a4 4 0 0 0 4-4V7a4 4 0 0 0-8 0v2a4 4 0 0 0 4 4zM6 11a6 6 0 0 0 12 0M12 17v4" />,
  "content-console": <path d="M4 5h16v14H4zM4 9h16M8 13h5M8 16h8" />,
  "brand-guide": <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />,
  automations: <path d="M5 12h4l2-4 3 8 2-4h3M5 5h14M5 19h14" />,
};

export default function Home() {
  return (
    <>
      <Seo title="Goodwork — Build better. Launch faster." description={DESCRIPTION} schema={[website(), faqPage(FAQ)]} />

      {/* 3. Hero */}
      <header className="gw-hero gw-aurora-host">
        <div className="gw-aurora" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
        <ShaderField />
        <div className="gw-container">
          <div className="gw-hero__grid gw-hero__grid--stamp">
            <div>
              <Reveal variant="fade">
                <p className="gw-eyebrow gw-pulse">Websites · Agents · Business systems</p>
              </Reveal>
              <SparklesText as="div" className="gw-mt-3" count={14}>
                <Headline
                  onMount
                  className="gw-h1"
                  lines={[
                    "Build better.",
                    <>
                      Launch{" "}
                      <span className="gw-nowrap">
                        <em className="gw-grad">faster</em>
                        <span className="gw-dot" aria-hidden="true" />
                      </span>
                    </>,
                  ]}
                />
              </SparklesText>
              <Reveal variant="rise" delay={260}>
                <p className="gw-lead gw-max gw-mt-4">
                  Production-ready websites, AI agents and business systems for people who want to move. Use Goodwork's code and systems yourself—or let
                  us build the complete operation for you.
                </p>
              </Reveal>
              <Reveal variant="rise" delay={380}>
                <div className="gw-actions gw-mt-4">
                  <Button to="/library" size="lg" arrow>
                    Explore the Library
                  </Button>
                  <Button to="/pricing" variant="secondary" size="lg">
                    Compare the offers
                  </Button>
                </div>
              </Reveal>
              <Reveal variant="fade" delay={460}>
                <p className="gw-proof gw-mt-4">
                  {PROOF_LINE.map((p) => (
                    <span key={p}>{p}</span>
                  ))}
                </p>
              </Reveal>
            </div>
            <Reveal variant="scale" delay={420} className="gw-hero__stamp">
              <Stamp size={168} />
            </Reveal>
          </div>
        </div>
      </header>

      <Marquee items={TICKER} />

      {/* 4. Two ways to work with Goodwork: the original's hard black block */}
      <section className="gw-dark gw-block" aria-labelledby="two-ways">
        <div className="gw-container">
          <Reveal variant="rise">
            <p className="gw-eyebrow">Two ways in</p>
            <Display id="two-ways" className="gw-mt-2">
              Two ways
              <br />
              to work
            </Display>
            <p className="gw-lead gw-max gw-mt-3">Build with Goodwork—or have Goodwork build it.</p>
          </Reveal>
          <div className="gw-grid gw-grid--2 gw-mt-5">
            {TWO_WAYS.map((w, i) => (
              <Reveal key={w.id} variant="rise" delay={i * 90} asChild>
                <GlowCard>
                  <span className="gw-card__mark" aria-hidden="true">
                    {i + 1}
                  </span>
                  <h3 className="gw-h3">{w.title}</h3>
                  <p className="gw-body gw-mt-2">{w.copy}</p>
                  <div className="gw-actions gw-mt-3">
                    <Button to={w.cta.to} variant={i === 0 ? "primary" : "secondary"} arrow>
                      {w.cta.label}
                    </Button>
                  </div>
                </GlowCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Interactive library preview */}
      <LibraryPreviewSection />

      {/* 6. The offer ladder */}
      <section className="gw-section gw-light" id="offers" aria-labelledby="ladder">
        <div className="gw-container">
          <SectionHead eyebrow="The offers" title={<span id="ladder">Start where you are. Move up when you need us.</span>} lead="Every product and service is paid once. Prices are the same everywhere on this site; what changes is who does the work." />
          <div className="gw-mt-4">
            <OfferLadder />
          </div>
        </div>
      </section>

      {/* 7. Product-system demonstration */}
      <section className="gw-section" aria-labelledby="journey">
        <div className="gw-container">
          <SectionHead eyebrow="The connected system" title={<span id="journey">More than a collection of pretty sections.</span>} lead="A website is only one part of the operation. Goodwork connects the customer journey—from the first visit and conversation to content, follow-up and sales management." />
          <div className="gw-mt-4">
            <SystemJourney />
          </div>
        </div>
      </section>

      {/* 8. Studio feature section */}
      <section className="gw-section gw-light" aria-labelledby="studio-systems">
        <div className="gw-container">
          <div className="gw-pagehead__row">
            <SectionHead eyebrow={`Goodwork Studio · ${gbp(OFFER.studio.price)} one-time`} title={<span id="studio-systems">The system behind the website.</span>} lead={OFFER.studio.distinction} />
            <Reveal variant="rise" delay={120}>
              <Button to="/studio" variant="secondary" arrow>
                See Goodwork Studio
              </Button>
            </Reveal>
          </div>
          <div className="gw-grid gw-grid--3 gw-mt-4">
            {STUDIO_FEATURES.map((f, i) => (
              <Reveal key={f.id} variant="rise" delay={i * 60} asChild>
                <Link to={f.to} className="gw-feature">
                  <span className="gw-feature__icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      {ICONS[f.id]}
                    </svg>
                  </span>
                  <h3 className="gw-h4">{f.name}</h3>
                  <p className="gw-body gw-small">{f.copy}</p>
                  <span className="gw-feature__go">See the system →</span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Built by Goodwork — contrasting light section */}
      <section className="gw-section" aria-labelledby="built">
        <div className="gw-container">
          <div className="gw-split">
            <SectionHead eyebrow={`Built by Goodwork · ${gbp(OFFER.built.price)} one-time`} title={<span id="built">Do not want to assemble it? We will.</span>} lead={`For ${gbp(OFFER.built.price)}, Goodwork takes the Studio system and turns it into a complete, branded implementation for one business. The scope is agreed first, the build is completed properly and the ongoing running costs remain clear.`}>
              <div className="gw-actions gw-mt-4">
                <Button to="/built-by-goodwork" arrow>
                  See the {gbp(OFFER.built.price)} implementation
                </Button>
                <Button to="/built-by-goodwork#scope" variant="secondary">
                  View the scope
                </Button>
              </div>
            </SectionHead>
            <Reveal variant="rise" delay={120}>
              <div className="gw-card">
                <p className="gw-eyebrow">What one build covers</p>
                <ul className="gw-list gw-mt-3">
                  {OFFER.built.includes.slice(1, 9).map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
                <p className="gw-small gw-muted gw-mt-3">Third-party and operational charges are not included in the {gbp(OFFER.built.price)} implementation fee.</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 10. Embedded CRM */}
      <section className="gw-section gw-light" aria-labelledby="crm">
        <div className="gw-container">
          <div className="gw-split gw-split--reverse">
            <Reveal variant="rise" delay={100}>
              <div className="gw-card">
                <div className="gw-pagehead__row">
                  <div>
                    <p className="gw-eyebrow">Add-on or standalone</p>
                    <h3 className="gw-h3 gw-mt-1">{OFFER.crm.name}</h3>
                  </div>
                  <Price amount={OFFER.crm.price} billing="one-time" />
                </div>
                <ul className="gw-list gw-list--cols gw-mt-3">
                  {OFFER.crm.includes.slice(0, 8).map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
                <hr className="gw-rule gw-mt-3" />
                <ul className="gw-list gw-list--x gw-list--tight gw-mt-3">
                  {OFFER.crm.excludes.slice(0, 3).map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <SectionHead eyebrow={`Embedded CRM · ${gbp(OFFER.crm.price)} one-time`} title={<span id="crm">Keep every lead, answer and next action in one place.</span>} lead={`Add a branded CRM to your Goodwork system for a one-time implementation fee of ${gbp(OFFER.crm.price)}. Your server and variable communication costs remain separate, so you retain a clear view of ownership and operating cost.`}>
              <div className="gw-actions gw-mt-4">
                <Button to="/crm" variant="secondary" arrow>
                  Explore the Embedded CRM
                </Button>
              </div>
            </SectionHead>
          </div>
        </div>
      </section>

      {/* 11. Agency programme */}
      <section className="gw-section gw-dark" aria-labelledby="agency">
        <div className="gw-container">
          <div className="gw-split">
            <SectionHead eyebrow="The Agency programme" title={<span id="agency">A website does not make an agency. The operation behind it does.</span>} lead="Goodwork helps shape the positioning, offers, brand, sales process, delivery system, CRM, automation and launch infrastructure required to operate a modern agency.">
              <p className="gw-price gw-mt-4">
                <span className="gw-price__amount gw-price__amount--sm">{gbp(OFFER.agency.price)}</span>
                <span className="gw-price__term">or four agreed payments of {gbp(OFFER.agency.instalments.amount)}</span>
              </p>
              <div className="gw-actions gw-mt-3">
                <Button to="/agency#apply" arrow>
                  Apply to Build Your Agency
                </Button>
                <Button to="/agency" variant="secondary">
                  Explore the Agency Programme
                </Button>
              </div>
            </SectionHead>
            <Reveal variant="rise" delay={120}>
              <div className="gw-card">
                <p className="gw-eyebrow">Beyond the website</p>
                <ul className="gw-list gw-mt-3">
                  {["Agency positioning and ideal-customer definition", "Offer architecture, packages and pricing", "Sales pipeline, proposals, onboarding and SOPs", "Embedded CRM, WhatsApp bot and voice agent", "Content and launch strategy with defined sessions"].map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
                <p className="gw-small gw-muted gw-mt-3">{OFFER.agency.licenceNote}</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 12. Managed infrastructure */}
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

      {/* 13. Showcase: the work, travelling sideways as you scroll */}
      <section className="gw-dark" aria-labelledby="showcase">
        <div className="gw-block__rule" aria-hidden="true" />
        <div className="gw-section--tight">
          <div className="gw-container">
            <Reveal variant="rise">
              <p className="gw-eyebrow">Showcase · selected work</p>
              <SparklesText as="div" count={10}>
                <h2 className="gw-display gw-mt-2" id="showcase">
                  Recent
                  <br />
                  projects
                </h2>
              </SparklesText>
              <p className="gw-lead gw-max gw-mt-3">
                Live projects and completed builds on the Goodwork system, with the problem, what was created and which systems it used. No invented
                results.
              </p>
            </Reveal>
          </div>
        </div>
        <HorizontalWork items={WORK} endLabel="That's the showcase" endLine="Yours could be next" />
        <div className="gw-section--tight">
          <div className="gw-container">
            <Reveal variant="rise">
              <Button to="/showcase" arrow>
                See the showcase
              </Button>
            </Reveal>
          </div>
        </div>
      </section>

      {/* How we work: the original's white statement with the stamp */}
      <section className="gw-section" aria-labelledby="how-we-work">
        <div className="gw-container">
          <Reveal variant="rise">
            <div className="gw-approved">
              <Stamp size={120} />
              <div>
                <p className="gw-eyebrow">How we work</p>
                <h2 className="gw-display gw-mt-2" id="how-we-work">
                  Understand.
                  <br />
                  Think. Make.
                  <br />
                  Improve.
                </h2>
              </div>
            </div>
          </Reveal>
          <Reveal variant="rise" delay={120}>
            <p className="gw-lead gw-max gw-mt-4">
              No unnecessary agency process. We work out what matters, then we make it better—and keep making it better once it's live.
            </p>
          </Reveal>
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
