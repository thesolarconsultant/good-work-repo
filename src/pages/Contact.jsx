import { useSearchParams } from "react-router-dom";
import Seo from "../components/Seo";
import PageHeader from "../components/PageHeader";
import Reveal from "../components/Reveal";
import Button from "../components/Button";
import EnquiryForm from "../components/EnquiryForm";
import { OFFERS } from "../data/offers";
import { gbp } from "../lib/format";
import { CONTACT_EMAIL } from "../lib/site";

const ROUTES = [
  { label: "Built by Goodwork enquiry", to: "/built-by-goodwork#enquire", note: `${gbp(2800)} implementation for one business` },
  { label: "Embedded CRM enquiry", to: "/crm#enquire", note: `${gbp(1888)} implementation, server excluded` },
  { label: "Agency application", to: "/agency#apply", note: `${gbp(8888.88)} programme, reviewed by a person` },
];

export default function Contact() {
  const [params] = useSearchParams();
  const topic = params.get("topic") || "";
  const plan = params.get("plan");
  const prefill = {
    topic: OFFERS.some((o) => o.id === topic) || ["managed", "licence", "other"].includes(topic) ? topic : "",
    message: plan ? `I'm interested in the ${plan} managed plan.\n\n` : "",
  };

  return (
    <>
      <Seo title="Contact Goodwork" description="Ask about the Library, Studio, a build, the CRM, the Agency programme or managed infrastructure. A reply from a person within one working day." />

      <PageHeader eyebrow="Talk to Goodwork" lines={["A clear question gets", "a clear answer."]} lead="Tell us what you're trying to do and we'll point you at the right route, including telling you when the cheaper option is the right one.">
        <p className="gw-small gw-muted">
          Or email <a className="gw-link" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Replies within one working day.
        </p>
      </PageHeader>

      <section className="gw-section--tight">
        <div className="gw-container">
          <div className="gw-split" style={{ "--gw-split": "minmax(0,1.2fr) minmax(0,0.8fr)" }}>
            <Reveal variant="rise" asChild>
              <div className="gw-card">
                <EnquiryForm formId="contact" prefill={prefill} source="contact-page" />
              </div>
            </Reveal>
            <div style={{ display: "grid", gap: "1rem", alignContent: "start" }}>
              <Reveal variant="rise" delay={80} asChild>
                <div className="gw-card gw-card--flat">
                  <p className="gw-eyebrow">Already know what you want?</p>
                  <p className="gw-small gw-body gw-mt-1">Each service has its own structured enquiry, so the first reply is useful rather than a request for more detail.</p>
                  <div className="gw-mt-3" style={{ display: "grid", gap: "0.5rem" }}>
                    {ROUTES.map((r) => (
                      <Button key={r.to} to={r.to} variant="secondary" size="sm" style={{ justifyContent: "space-between" }} arrow>
                        {r.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </Reveal>
              <Reveal variant="rise" delay={140} asChild>
                <div className="gw-card gw-card--flat">
                  <p className="gw-eyebrow">What happens next</p>
                  <ul className="gw-list gw-list--tight gw-mt-2">
                    <li>A reply from a person within one working day</li>
                    <li>A short call if it needs one</li>
                    <li>For services, a written scope and fixed price before anything starts</li>
                  </ul>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
