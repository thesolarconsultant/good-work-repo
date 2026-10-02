import Seo from "../components/Seo";
import PageHeader from "../components/PageHeader";
import SectionHead from "../components/SectionHead";
import Button from "../components/Button";
import SystemJourney from "../components/SystemJourney";
import StudioBento from "../components/StudioBento";
import { OFFER } from "../data/offers";
import { breadcrumbs } from "../lib/schema";
import { gbp } from "../lib/format";

export default function Systems() {
  const crumbs = [{ label: "Home", to: "/" }, { label: "Systems" }];
  return (
    <>
      <Seo title="Systems — AI website systems, WhatsApp bot, voice agent, Content Console" description={`The intelligent systems inside Goodwork Studio (${gbp(OFFER.studio.price)} one-time): WhatsApp bot, AI voice agent, Content Console, brand guide system and automation blueprints. Self-build, or installed by Goodwork.`} schema={breadcrumbs(crumbs)} />

      <PageHeader crumbs={crumbs} eyebrow={`Goodwork Studio · ${gbp(OFFER.studio.price)} one-time`} lines={["The system behind", "the website."]} lead="Five systems that connect the customer journey: the conversation, the calls, the content and the pipeline. Each ships with its source, a setup guide and the checklist to launch it.">
        <div className="gw-actions">
          <Button to="/studio#access" arrow>
            {OFFER.studio.primaryCta.label}
          </Button>
          <Button to="/built-by-goodwork" variant="secondary">
            Have Goodwork install them
          </Button>
        </div>
      </PageHeader>

      <section className="gw-section gw-dark" aria-labelledby="list-title">
        <div className="gw-container">
          <h2 className="gw-sr-only" id="list-title">
            The systems
          </h2>
          <StudioBento />
        </div>
      </section>

      <section className="gw-section gw-surface" aria-labelledby="journey-title">
        <div className="gw-container">
          <SectionHead eyebrow="Connected" title={<span id="journey-title">One journey, five systems.</span>} />
          <div className="gw-mt-4">
            <SystemJourney />
          </div>
        </div>
      </section>
    </>
  );
}
