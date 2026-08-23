import { useRef, useState } from "react";
import Footer from "../components/Footer";
import Headline from "../components/Headline";
import Reveal from "../components/Reveal";
import ShaderField from "../components/ShaderField";
import Seo from "../components/Seo";
import { SITE_URL } from "../lib/site";

const SCHEMA = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  url: `${SITE_URL}/contact`,
  mainEntity: { "@id": `${SITE_URL}/#organisation` },
};

const INTERESTS = [
  "Website & brand",
  "The Content Console",
  "Systems & automation",
  "Ads & reporting",
  "Not sure yet",
];

export default function Contact() {
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState({});
  const formRef = useRef(null);

  function handleSubmit(e) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);

    // Bots fill in everything, including fields nobody can see.
    if (data.get("company-website")) return;

    const next = {};
    if (!String(data.get("name") || "").trim()) next.name = "We'll need a name to reply to.";
    const email = String(data.get("email") || "").trim();
    if (!email) next.email = "We'll need an email to reply to.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "That doesn't look like an email address.";

    setErrors(next);
    if (Object.keys(next).length > 0) {
      // Send focus to the first thing that needs fixing.
      formRef.current?.querySelector(`[name="${Object.keys(next)[0]}"]`)?.focus();
      return;
    }

    // Replace with a real submit — e.g. fetch() to a form endpoint,
    // your CRM's API, or a service like Formspree — before going live.
    setSent(true);
  }

  return (
    <>
      <Seo
        title="Start a project"
        description="Tell us about the business and what's not working. We'll come back with what Good Work would look like — scope, price and what it should change."
        schema={SCHEMA}
      />

      <header className="gw-section--tight gw-hero" style={{ paddingTop: "clamp(2.5rem,6vw,4rem)" }}>
        <div className="gw-aurora" aria-hidden="true">
          <span /><span /><span /><span />
        </div>
        <ShaderField />
        <div className="gw-container">
          <p className="gw-label gw-pulse">Get in touch</p>
          <Headline
            onMount
            className="gw-h1 gw-stack-md"
            lines={["Got something worth", <>making better<span className="gw-dot" /></>]}
          />
          <Reveal variant="rise" delay={240}>
            <p className="gw-body-large gw-max-copy gw-text-muted gw-stack-md">
              Tell us about the business and what's not working. We'll come back with what Good
              Work would look like.
            </p>
          </Reveal>
        </div>
      </header>

      <section className="gw-section" style={{ paddingTop: 0 }}>
        <div className="gw-container">
          <div className="gw-grid gw-grid--split">
            <div aria-live="polite">
              {!sent ? (
                <Reveal variant="rise" asChild>
                  <form className="gw-card" onSubmit={handleSubmit} ref={formRef} noValidate>
                    <div className="gw-field">
                      <label htmlFor="name">Name</label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        placeholder="Your name"
                        aria-invalid={errors.name ? "true" : undefined}
                        aria-describedby={errors.name ? "name-error" : undefined}
                      />
                      {errors.name && (
                        <p className="gw-field__error" id="name-error">{errors.name}</p>
                      )}
                    </div>

                    <div className="gw-field">
                      <label htmlFor="business">Business</label>
                      <input
                        id="business"
                        name="business"
                        type="text"
                        autoComplete="organization"
                        placeholder="Business name"
                      />
                    </div>

                    <div className="gw-field">
                      <label htmlFor="email">Email</label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        placeholder="you@business.com"
                        aria-invalid={errors.email ? "true" : undefined}
                        aria-describedby={errors.email ? "email-error" : undefined}
                      />
                      {errors.email && (
                        <p className="gw-field__error" id="email-error">{errors.email}</p>
                      )}
                    </div>

                    <div className="gw-field">
                      <label htmlFor="interest">What are you after?</label>
                      <select id="interest" name="interest" defaultValue="">
                        <option value="" disabled>Choose one</option>
                        {INTERESTS.map((i) => (
                          <option key={i}>{i}</option>
                        ))}
                      </select>
                    </div>

                    <div className="gw-field">
                      <label htmlFor="message">Tell us about the business</label>
                      <textarea
                        id="message"
                        name="message"
                        rows="5"
                        placeholder="What you do, what's not working, what you want to change"
                      />
                    </div>

                    {/* Honeypot — hidden from people, irresistible to bots. */}
                    <div className="gw-honeypot" aria-hidden="true">
                      <label htmlFor="company-website">Company website</label>
                      <input id="company-website" name="company-website" type="text" tabIndex={-1} autoComplete="off" />
                    </div>

                    <button type="submit" className="gw-button" style={{ width: "100%" }}>
                      <span className="gw-button__label">Send</span>
                      <span className="gw-button__arrow" aria-hidden="true">→</span>
                    </button>
                  </form>
                </Reveal>
              ) : (
                <div className="gw-card gw-card--soft gw-sent">
                  <div className="gw-sent__tick" aria-hidden="true">
                    <svg viewBox="0 0 40 40" role="presentation">
                      <circle className="gw-sent__ring" cx="20" cy="20" r="17" />
                      <path className="gw-sent__check" d="M12 20.5l5.5 5.5L28.5 15" />
                    </svg>
                  </div>
                  <h2 className="gw-h3">
                    That's sent<span className="gw-dot" />
                  </h2>
                  <p className="gw-body gw-text-muted gw-stack-sm">
                    We'll come back to you within one working day.
                  </p>
                </div>
              )}
            </div>

            <div className="gw-contact-aside">
              <Reveal variant="rise" delay={90} asChild>
                <div className="gw-card gw-card--soft">
                  <p className="gw-label" style={{ marginBottom: 8 }}>Email</p>
                  <a className="gw-body gw-link" href="mailto:hello@goodwork.agency">
                    hello@goodwork.agency
                  </a>
                </div>
              </Reveal>
              <Reveal variant="rise" delay={170} asChild>
                <div className="gw-card gw-card--soft">
                  <p className="gw-label" style={{ marginBottom: 8 }}>Response time</p>
                  <p className="gw-body">Within one working day.</p>
                </div>
              </Reveal>
              <Reveal variant="rise" delay={250} asChild>
                <div className="gw-card gw-card--soft">
                  <p className="gw-label" style={{ marginBottom: 8 }}>What happens next</p>
                  <p className="gw-body">
                    A short call, then a scope and a fixed price. Nothing starts until you've
                    agreed it.
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <Footer statement="That's Good Work" />
    </>
  );
}
