import BrollStudio from "../components/BrollStudio";
import Button from "../components/Button";
import Footer from "../components/Footer";
import Headline from "../components/Headline";
import Reveal from "../components/Reveal";
import Seo from "../components/Seo";
import { SITE_URL } from "../lib/site";
import Shot from "../components/Shot";
import Stamp from "../components/Stamp";
import Stat from "../components/Stat";
import { CONSOLE_SECTIONS, ENGINE_SECTIONS, CONSOLE_OUTCOMES } from "../data/console";

const SCHEMA = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "The Content Console",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: `${SITE_URL}/content-console`,
  description:
    "One dashboard that plans, writes and publishes everything a business puts out — blogs, social, email and WhatsApp — then pushes it live on its own.",
  provider: { "@id": `${SITE_URL}/#organisation` },
};

function Section({ s, dark = false, index = 0 }) {
  return (
    <div className="gw-console-section" id={s.id}>
      <Reveal variant={dark ? "right" : "left"} className="gw-console-copy">
        <p className="gw-label">{s.kicker}</p>
        <h3 className="gw-h3" style={{ marginTop: 8 }}>{s.title}</h3>
        <p
          className="gw-body gw-stack-md"
          style={{ color: dark ? "rgba(255,255,255,0.72)" : "var(--gw-grey-700)" }}
        >
          {s.does}
        </p>
        <div className="gw-why">
          <span className="gw-why__label">Why it matters</span>
          <p className="gw-body">{s.great}</p>
        </div>
      </Reveal>
      {s.shot && (
        <Shot
          src={s.shot.src}
          alt={s.shot.caption}
          caption={s.shot.caption}
          className="gw-console-shot"
          sizes="(max-width: 860px) 100vw, 620px"
          priority={index === 0}
        />
      )}
    </div>
  );
}

export default function ContentConsole() {
  return (
    <>
      <Seo
        title="The Content Console"
        description="One screen that plans, writes and publishes everything a business puts out — blogs, social, email, WhatsApp — then pushes it live on its own. Built and running for The Solar Consultant and 8energy."
        schema={SCHEMA}
      />

      <header className="gw-section--tight gw-hero" style={{ paddingTop: "clamp(2.5rem,6vw,4rem)" }}>
        <div className="gw-aurora" aria-hidden="true">
          <span /><span /><span /><span />
        </div>
        <div className="gw-container">
          <p className="gw-label gw-pulse">The Content Console</p>
          <Headline
            onMount
            className="gw-h1 gw-stack-md"
            lines={["Your business,", <>never <em className="gw-grad">quiet</em><span className="gw-dot" /></>]}
          />
          <Reveal variant="rise" delay={240}>
            <p className="gw-body-large gw-max-copy gw-text-muted gw-stack-md">
              One screen that plans, writes and publishes everything a business puts out — blogs,
              social, email, WhatsApp — then pushes it live on its own. Built and running for The
              Solar Consultant and 8energy.
            </p>
          </Reveal>
          <Reveal variant="rise" delay={340}>
            <div className="gw-actions gw-stack-lg">
              <Button to="/contact" arrow>Get this for your business</Button>
              <Button to="/case-studies" variant="outline">See it in context</Button>
            </div>
          </Reveal>
        </div>
      </header>

      <hr className="gw-rule--gradient" style={{ border: 0 }} />

      <section className="gw-section--tight">
        <div className="gw-container">
          <div className="gw-facts">
            {CONSOLE_OUTCOMES.map((o, i) => (
              <Stat key={o.label} figure={o.figure} label={o.label} delay={i * 110} />
            ))}
          </div>
        </div>
      </section>

      <section className="gw-section--tight">
        <div className="gw-container">
          <Reveal variant="rise">
            <h2 className="gw-h2">The problem it solves</h2>
            <p className="gw-body-large gw-max-copy gw-text-muted gw-stack-md">
              Small businesses don't go quiet online because they don't see the point. They go
              quiet because writing a post is the last thing on the list after a full day on site,
              the website needs a developer to touch, and nobody can remember the login to the
              thing that posts to Instagram.
            </p>
            <p className="gw-body gw-max-copy gw-text-muted gw-stack-md">
              The Content Console removes every one of those excuses. Below is what each part
              does, and why it earns its place.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="gw-section">
        <div className="gw-container">
          <Reveal variant="rise">
            <p className="gw-label">Part one</p>
            <h2 className="gw-h2 gw-stack-sm">The console</h2>
            <p className="gw-body gw-max-copy gw-text-muted gw-stack-sm">
              The screens a client uses every week. The screenshots are The Solar Consultant's
              console — the fullest build, shown here on their own live backlog — with 8energy's
              Studio where it makes the same point in fewer moves.
            </p>
          </Reveal>
          {CONSOLE_SECTIONS.map((s, i) => (
            <Section key={s.id} s={s} index={i} />
          ))}
        </div>
      </section>

      <section className="gw-section gw-dark">
        <div className="gw-container">
          <Reveal variant="rise">
            <div className="gw-approved" style={{ marginBottom: 28 }}>
              <Stamp size={120} />
              <div>
                <p className="gw-label">Part two</p>
                <h2 className="gw-h2" style={{ color: "var(--gw-white)" }}>The engine behind it</h2>
              </div>
            </div>
            <p className="gw-body-large gw-max-copy">
              A console that publishes fast is only worth having if what goes through it is worth
              reading. This is the part built for The Solar Consultant, where no number reaches a
              published page without surviving a check.
            </p>
          </Reveal>
          {ENGINE_SECTIONS.map((s) => (
            <div key={s.id}>
              <Section s={s} dark />
              {/* The branded-video section is the one claim on this page we can
                  demonstrate rather than describe. Renders nothing unless the
                  Higgsfield function is deployed — see api/broll.js. */}
              {s.id === "broll" && <BrollStudio />}
            </div>
          ))}
        </div>
      </section>

      <section className="gw-section">
        <div className="gw-container">
          <Reveal variant="rise">
            <p className="gw-label">What changes</p>
            <h2 className="gw-h2 gw-stack-sm">Ten minutes a week, not an agency retainer</h2>
            <p className="gw-body gw-max-copy gw-text-muted gw-stack-md">
              The business looks active because it is active. Articles go out on the subjects
              customers actually search for, the social posts go with them, the emails and replies
              stay in one voice, and none of it depends on someone finding a spare evening to write.
            </p>
            <p className="gw-body gw-max-copy gw-text-muted gw-stack-md">
              You own the console, the content and the repository it lives in. Nothing here is
              rented back to you.
            </p>
            <div className="gw-actions gw-stack-lg">
              <Button to="/contact" arrow>Talk to us about it</Button>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer statement="Make your business look as good as it actually is" />
    </>
  );
}
