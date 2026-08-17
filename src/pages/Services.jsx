import Footer from "../components/Footer";
import ServiceSelector from "../components/ServiceSelector";

const TIERS = [
  {
    name: "Foundation",
    sub: "One-time build",
    price: "£750–£1,250",
    priceSmall: null,
    desc: "The essentials, done properly — live, verified, and ready to hand to customers.",
    includesPrev: null,
    features: ["Custom website", "Brand refresh — logo, colour, type", "Google & Meta business verification", "Email signature strip", "Starter email templates"],
    variant: "default",
  },
  {
    name: "Grow",
    sub: "Build + monthly",
    price: "£1,500–£2,250",
    priceSmall: "+ £150–250/mo",
    desc: "A full identity, plus the engine that keeps your name in front of customers.",
    includesPrev: "Everything in Foundation, plus:",
    features: ["Full brand identity", "Social accounts set up & seeded", "The Content Console — see below", "GA4 setup", "ID badges / staff cards"],
    variant: "soft",
  },
  {
    name: "Scale",
    sub: "Build + full retainer",
    price: "£3,000–£4,500",
    priceSmall: "+ £400–750/mo",
    desc: "The business runs itself between jobs — leads qualified, quoted, contracted and followed up.",
    includesPrev: "Everything in Grow, plus:",
    features: ["Always-on WhatsApp booking & qualifying", "Missed-call answering & callback booking", "Quick quoting & contracting app, white-labelled", "Contracts — wording & design", "Meta ads: setup, running, optimising, reporting"],
    variant: "outline-dark",
  },
];

const ADDONS = [
  { mark: "01", title: "Quoting engine, built into the app", desc: "Base rate + variables so a customer gets a live price, not a callback promise. Good/Better/Best presets, margin floors set by the owner, quote flows straight into a contract and a deposit link." },
  { mark: "02", title: "Missed-call answering", desc: "Answers calls that go unanswered, books a callback or routes the caller straight to WhatsApp. No lead goes cold overnight." },
  { mark: "03", title: "Social media account setup", desc: "Profiles built and optimised across Meta, LinkedIn, TikTok and Google Business Profile, seeded with the first 5–10 posts so launch day isn't an empty page." },
];

function tierCardClass(variant) {
  if (variant === "soft") return "gw-card gw-card--soft";
  return "gw-card";
}

export default function Services() {
  return (
    <>
      <header className="gw-section--tight" style={{ paddingTop: "clamp(2.5rem,6vw,4rem)" }}>
        <div className="gw-container">
          <p className="gw-label" style={{ marginBottom: 14 }}>Services &amp; pricing</p>
          <h1 className="gw-h1">Brand. Websites.<br />Systems<span className="gw-dot"></span></h1>
          <p className="gw-body-large gw-max-copy gw-text-muted" style={{ marginTop: 18 }}>
            Everything a business needs to look and work better — built properly, and kept running after launch.
          </p>
        </div>
      </header>

      <hr className="gw-rule--gradient" style={{ border: 0 }} />

      <section className="gw-section">
        <div className="gw-container">
          <p className="gw-label" style={{ marginBottom: 10 }}>What we build</p>
          <h2 className="gw-h2">Three tiers. One standard.</h2>
          <p className="gw-body gw-max-copy gw-text-muted" style={{ marginTop: 12, marginBottom: 36 }}>
            Start with a proper foundation. Add the systems that keep new business coming in without you chasing it.
            {" "}<a href="#configure" style={{ textDecoration: "underline" }}>Or build your own package →</a>
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {TIERS.map((t) => (
              <div
                className={tierCardClass(t.variant)}
                key={t.name}
                style={t.variant === "outline-dark" ? { borderColor: "var(--gw-black)" } : undefined}
              >
                <div className="gw-card__label">
                  <div>
                    <h3 className="gw-h3">{t.name}</h3>
                    <p className="gw-label" style={{ marginTop: 4 }}>{t.sub}</p>
                  </div>
                  <div className="gw-price">
                    {t.price}
                    {t.priceSmall && <small>{t.priceSmall}</small>}
                  </div>
                </div>
                <p className="gw-body gw-text-muted">{t.desc}</p>
                {t.includesPrev && <p className="gw-includes-prev">{t.includesPrev}</p>}
                <ul className="gw-features">
                  {t.features.map((f) => <li key={f}>{f}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="gw-section gw-dark">
        <div className="gw-container">
          <div className="gw-approved" style={{ marginBottom: 28 }}>
            <div className="gw-stamp"><div className="gw-stamp__centre">GOOD<br />WORK.</div></div>
            <div>
              <p className="gw-label">Included from Grow upward</p>
              <h2 className="gw-h2" style={{ color: "var(--gw-white)" }}>The Content Console</h2>
            </div>
          </div>
          <p className="gw-body-large gw-max-copy" style={{ marginBottom: 24 }}>
            One dashboard that keeps a business looking active, without anyone sitting down to write it.
          </p>
          <ul className="gw-features" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
            <li>Blog generator + scheduler</li>
            <li>Social posts + scheduler</li>
            <li>WhatsApp message templates</li>
            <li>Email templates</li>
            <li>Email signature generator</li>
            <li>ID badge &amp; staff card generator</li>
          </ul>
        </div>
      </section>

      <section className="gw-section">
        <div className="gw-container">
          <p className="gw-label" style={{ marginBottom: 10 }}>Add-ons</p>
          <h2 className="gw-h2">Priced where they earn it</h2>
          <p className="gw-body gw-max-copy gw-text-muted" style={{ marginTop: 12, marginBottom: 8 }}>
            Some pieces are heavy builds on their own — sold standalone so a Foundation client isn't paying for the whole top tier.
          </p>
          <div style={{ marginTop: 20 }}>
            {ADDONS.map((a) => (
              <div className="gw-addon" key={a.mark}>
                <div className="gw-addon-mark">{a.mark}</div>
                <div className="gw-addon-body">
                  <strong>{a.title}</strong>
                  <span>{a.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ServiceSelector />

      <Footer statement="Make your business look as good as it actually is" />
    </>
  );
}
