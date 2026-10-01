import Seo from "../components/Seo";
import PageHeader from "../components/PageHeader";
import SectionHead from "../components/SectionHead";
import Reveal from "../components/Reveal";
import Button from "../components/Button";
import ManagedPlans from "../components/ManagedPlans";
import { OWNERSHIP_PRINCIPLE, MANAGED_PLANS, SELF_HOST_NOTE } from "../data/offers";
import { breadcrumbs } from "../lib/schema";
import { gbp } from "../lib/format";

const WHAT_YOU_PAY = [
  { t: "Hosting and servers", d: "Static hosting for the website, a runtime for the console and agents, and a server for the CRM if you take it. Yours, or ours on a plan." },
  { t: "Messaging", d: "WhatsApp conversation charges are set by Meta and your messaging provider. Covered by the monthly credit on the Complete plans; beyond it, billed at cost." },
  { t: "Telephony and voice", d: "Telephone numbers, call minutes and voice-model usage are billed by the providers. Additional numbers are quoted separately." },
  { t: "AI-model usage", d: "The Content Console and the agents call a model provider. Usage is metered by that provider and never bundled into a one-time fee." },
];

export default function Managed() {
  const crumbs = [{ label: "Home", to: "/" }, { label: "Services", to: "/services" }, { label: "Managed Infrastructure" }];
  return (
    <>
      <Seo title="Managed infrastructure — hosting, monitoring and maintenance per month" description={`Optional monthly plans from ${gbp(MANAGED_PLANS[0].price)} to ${gbp(MANAGED_PLANS.at(-1).price)} per month for Goodwork to host, monitor and maintain your website, Content Console, WhatsApp bot and voice agent. ${OWNERSHIP_PRINCIPLE}`} schema={breadcrumbs(crumbs)} />

      <PageHeader crumbs={crumbs} eyebrow="Managed infrastructure · optional · per month" lines={["Own the build.", "Choose who runs it."]} lead={SELF_HOST_NOTE}>
        <p className="gw-quote gw-max">{OWNERSHIP_PRINCIPLE}</p>
      </PageHeader>

      <section className="gw-section--tight" aria-labelledby="plans-title">
        <div className="gw-container">
          <SectionHead eyebrow="The plans" title={<span id="plans-title">Four plans, from a looked-after website to the whole system.</span>} />
          <div className="gw-mt-4">
            <ManagedPlans />
          </div>
        </div>
      </section>

      <section className="gw-section gw-light" aria-labelledby="costs-title">
        <div className="gw-container">
          <SectionHead eyebrow="Operational costs, in the open" title={<span id="costs-title">What will continue to cost money.</span>} lead="None of these are inside a one-time fee. On your own infrastructure you pay the providers directly; on the Complete plans, chatbot, voice-agent and API usage comes out of a monthly credit agreed before launch." />
          <div className="gw-grid gw-grid--2 gw-mt-4">
            {WHAT_YOU_PAY.map((w, i) => (
              <Reveal key={w.t} variant="rise" delay={i * 60} asChild>
                <div className="gw-card">
                  <h3 className="gw-h4">{w.t}</h3>
                  <p className="gw-small gw-body gw-mt-1">{w.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="gw-section" aria-labelledby="ask-title">
        <div className="gw-container gw-center">
          <SectionHead align="center" eyebrow="Choose a plan later" title={<span id="ask-title">Nothing here is decided at purchase.</span>} lead="Buy the product or the build first. Choose whether Goodwork runs it once the scope, the volumes and the allowances are clear.">
            <div className="gw-actions gw-mt-4" style={{ justifyContent: "center" }}>
              <Button to="/contact?topic=managed" arrow>
                Ask about a managed plan
              </Button>
              <Button to="/pricing" variant="secondary">
                Compare every option
              </Button>
            </div>
          </SectionHead>
        </div>
      </section>
    </>
  );
}
