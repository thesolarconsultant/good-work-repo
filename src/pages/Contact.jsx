import { useState } from "react";

export default function Contact() {
  const [sent, setSent] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    // Replace with a real submit — e.g. fetch() to a form endpoint,
    // your CRM's API, or a service like Formspree — before going live.
    setSent(true);
  }

  return (
    <>
      <header className="gw-section--tight" style={{ paddingTop: "clamp(2.5rem,6vw,4rem)" }}>
        <div className="gw-container">
          <p className="gw-label" style={{ marginBottom: 14 }}>Get in touch</p>
          <h1 className="gw-h1">Got something worth<br />making better<span className="gw-dot"></span></h1>
          <p className="gw-body-large gw-max-copy gw-text-muted" style={{ marginTop: 16 }}>
            Tell us about the business and what's not working. We'll come back with what Good Work would look like.
          </p>
        </div>
      </header>

      <section className="gw-section" style={{ paddingTop: 0 }}>
        <div className="gw-container">
          <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 48, alignItems: "start" }}>

            {!sent ? (
              <form className="gw-card" onSubmit={handleSubmit}>
                <div className="gw-field">
                  <label htmlFor="name">Name</label>
                  <input id="name" type="text" required placeholder="Your name" />
                </div>
                <div className="gw-field">
                  <label htmlFor="business">Business</label>
                  <input id="business" type="text" placeholder="Business name" />
                </div>
                <div className="gw-field">
                  <label htmlFor="email">Email</label>
                  <input id="email" type="email" required placeholder="you@business.com" />
                </div>
                <div className="gw-field">
                  <label htmlFor="interest">What are you after?</label>
                  <select id="interest" defaultValue="">
                    <option value="" disabled>Choose one</option>
                    <option>Foundation — website &amp; brand refresh</option>
                    <option>Grow — full brand &amp; Content Console</option>
                    <option>Scale — full systems &amp; retainer</option>
                    <option>Not sure yet</option>
                  </select>
                </div>
                <div className="gw-field">
                  <label htmlFor="message">Tell us about the business</label>
                  <textarea id="message" rows="5" placeholder="What you do, what's not working, what you want to change"></textarea>
                </div>
                <button type="submit" className="gw-button" style={{ width: "100%" }}>Send →</button>
              </form>
            ) : (
              <div className="gw-card gw-card--soft">
                <h3 className="gw-h3">That's sent<span className="gw-dot"></span></h3>
                <p className="gw-body gw-text-muted" style={{ marginTop: 10 }}>We'll come back to you shortly.</p>
              </div>
            )}

            <div>
              <div className="gw-card gw-card--soft" style={{ marginBottom: 16 }}>
                <p className="gw-label" style={{ marginBottom: 8 }}>Email</p>
                <p className="gw-body">hello@goodwork.agency</p>
              </div>
              <div className="gw-card gw-card--soft">
                <p className="gw-label" style={{ marginBottom: 8 }}>Response time</p>
                <p className="gw-body">Within one working day.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      <footer className="gw-footer">
        <div className="gw-container">
          <p className="gw-footer__statement">That's Good Work<span className="gw-dot"></span></p>
        </div>
      </footer>
    </>
  );
}
