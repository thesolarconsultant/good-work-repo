import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import { CONSOLE_SECTIONS, ENGINE_SECTIONS, CONSOLE_OUTCOMES } from "../data/console";

function Section({ s, dark = false }) {
  return (
    <div className="gw-console-section" id={s.id}>
      <div className="gw-console-copy">
        <p className="gw-label">{s.kicker}</p>
        <h3 className="gw-h3" style={{ marginTop: 8 }}>{s.title}</h3>
        <p className="gw-body" style={{ marginTop: 14, color: dark ? "rgba(255,255,255,0.72)" : "var(--gw-grey-700)" }}>
          {s.does}
        </p>
        <div className="gw-why">
          <span className="gw-why__label">Why it matters</span>
          <p className="gw-body">{s.great}</p>
        </div>
      </div>
      {s.shot && (
        <figure className="gw-shot gw-console-shot">
          <img src={s.shot.src} alt={s.shot.caption} loading="lazy" />
          <figcaption>{s.shot.caption}</figcaption>
        </figure>
      )}
    </div>
  );
}

export default function ContentConsole() {
  return (
    <>
      <header className="gw-section--tight" style={{ paddingTop: "clamp(2.5rem,6vw,4rem)" }}>
        <div className="gw-container">
          <p className="gw-label" style={{ marginBottom: 14 }}>The Content Console</p>
          <h1 className="gw-h1">Your business,<br />never quiet<span className="gw-dot"></span></h1>
          <p className="gw-body-large gw-max-copy gw-text-muted" style={{ marginTop: 18 }}>
            One screen that writes, schedules and publishes everything a business puts out — blogs, social,
            email, WhatsApp — then pushes it live on its own. Built and running for two clients today.
          </p>
          <div style={{ display: "flex", gap: 14, marginTop: 32, flexWrap: "wrap" }}>
            <Link to="/contact" className="gw-button">Get this for your business</Link>
            <Link to="/case-studies" className="gw-button gw-button--outline">See it in context</Link>
          </div>
        </div>
      </header>

      <hr className="gw-rule--gradient" style={{ border: 0 }} />

      <section className="gw-section--tight">
        <div className="gw-container">
          <div className="gw-facts">
            {CONSOLE_OUTCOMES.map((o) => (
              <div className="gw-fact" key={o.label}>
                <span className="gw-fact__figure">{o.figure}</span>
                <span className="gw-fact__label">{o.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="gw-section--tight">
        <div className="gw-container">
          <h2 className="gw-h2">The problem it solves</h2>
          <p className="gw-body-large gw-max-copy gw-text-muted" style={{ marginTop: 14 }}>
            Small businesses don't go quiet online because they don't see the point. They go quiet because
            writing a post is the last thing on the list after a full day on site, the website needs a developer
            to touch, and nobody can remember the login to the thing that posts to Instagram.
          </p>
          <p className="gw-body gw-max-copy gw-text-muted" style={{ marginTop: 14 }}>
            The Content Console removes every one of those excuses. Below is what each part does, and why it
            earns its place.
          </p>
        </div>
      </section>

      <section className="gw-section">
        <div className="gw-container">
          <p className="gw-label" style={{ marginBottom: 10 }}>Part one</p>
          <h2 className="gw-h2" style={{ marginBottom: 8 }}>The console</h2>
          <p className="gw-body gw-max-copy gw-text-muted" style={{ marginBottom: 8 }}>
            The screens a client uses every week. The Solar Consultant's console runs inside their staff portal,
            next to the CRM it feeds; 8energy's is a standalone Studio on their own subdomain — the screenshots
            below are that Studio, running on their real content.
          </p>
          {CONSOLE_SECTIONS.map((s) => <Section key={s.id} s={s} />)}
        </div>
      </section>

      <section className="gw-section gw-dark">
        <div className="gw-container">
          <div className="gw-approved" style={{ marginBottom: 28 }}>
            <div className="gw-stamp"><div className="gw-stamp__centre">GOOD<br />WORK.</div></div>
            <div>
              <p className="gw-label">Part two</p>
              <h2 className="gw-h2" style={{ color: "var(--gw-white)" }}>The engine behind it</h2>
            </div>
          </div>
          <p className="gw-body-large gw-max-copy" style={{ marginBottom: 8 }}>
            A console that publishes fast is only worth having if what goes through it is worth reading. This is
            the part built for The Solar Consultant, where no number reaches a published page without surviving
            a check.
          </p>
          {ENGINE_SECTIONS.map((s) => <Section key={s.id} s={s} dark />)}
        </div>
      </section>

      <section className="gw-section">
        <div className="gw-container">
          <p className="gw-label" style={{ marginBottom: 10 }}>What changes</p>
          <h2 className="gw-h2">Ten minutes a week, not an agency retainer</h2>
          <p className="gw-body gw-max-copy gw-text-muted" style={{ marginTop: 14 }}>
            The business looks active because it is active. Articles go out on the subjects customers actually
            search for, the social posts go with them, the emails and replies stay in one voice, and none of it
            depends on someone finding a spare evening to write.
          </p>
          <p className="gw-body gw-max-copy gw-text-muted" style={{ marginTop: 14 }}>
            You own the console, the content and the repository it lives in. Nothing here is rented back to you.
          </p>
          <Link to="/contact" className="gw-button" style={{ marginTop: 28 }}>Talk to us about it →</Link>
        </div>
      </section>

      <Footer statement="Make your business look as good as it actually is" />
    </>
  );
}
