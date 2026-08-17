import Footer from "../components/Footer";
import ServiceSelector from "../components/ServiceSelector";
import { CONSOLE_MODULES } from "../data/services";

const BILLING = [
  {
    mark: "01",
    title: "Paid once — the build",
    desc: "Anything we design, write or build for you: the website, the brand, the contracts, the apps and systems. You own the result. There's no lock-in and nothing stops working if you never spend another pound with us.",
  },
  {
    mark: "02",
    title: "Paid monthly — the running",
    desc: "Anything that has to keep working after launch: content going out, ads being managed, bots and agents answering, systems hosted, watched and updated. Priced monthly because the work is monthly — no minimum term.",
  },
];

const PROCESS = [
  { mark: "01", title: "Understand", desc: "A call to work out how you actually win jobs today, where enquiries come from, and what's leaking. No questionnaire, no discovery invoice." },
  { mark: "02", title: "Think", desc: "We come back with a scope and a fixed price — what gets built, what it costs to run, and what it should change. Nothing starts until you've agreed it." },
  { mark: "03", title: "Make", desc: "Built in weeks, not quarters. You see it as it goes, and it doesn't go live until it's verified — links, forms, tracking, the lot." },
  { mark: "04", title: "Improve", desc: "Where there's a monthly element, the work continues after launch: content going out, ads managed, systems watched, and a report you can read in two minutes." },
];

export default function Services() {
  return (
    <>
      <header className="gw-section--tight" style={{ paddingTop: "clamp(2.5rem,6vw,4rem)" }}>
        <div className="gw-container">
          <p className="gw-label" style={{ marginBottom: 14 }}>Services &amp; pricing</p>
          <h1 className="gw-h1">Brand. Websites.<br />Systems<span className="gw-dot"></span></h1>
          <p className="gw-body-large gw-max-copy gw-text-muted" style={{ marginTop: 18 }}>
            Everything a business needs to look and work better — built properly, and kept running after launch.
            Take one thing or the lot.
          </p>
        </div>
      </header>

      <hr className="gw-rule--gradient" style={{ border: 0 }} />

      <section className="gw-section">
        <div className="gw-container">
          <p className="gw-label" style={{ marginBottom: 10 }}>How it's priced</p>
          <h2 className="gw-h2">Two kinds of cost. Nothing hidden.</h2>
          <p className="gw-body gw-max-copy gw-text-muted" style={{ marginTop: 12, marginBottom: 8 }}>
            Every service below is either something we build once, something we run for you monthly, or a build
            with a running cost attached. Each one is labelled, so you can see exactly what you're committing to
            before you speak to us.
          </p>
          <div style={{ marginTop: 20 }}>
            {BILLING.map((b) => (
              <div className="gw-addon" key={b.mark}>
                <div className="gw-addon-mark">{b.mark}</div>
                <div className="gw-addon-body">
                  <strong>{b.title}</strong>
                  <span>{b.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ServiceSelector />

      <section className="gw-section gw-dark">
        <div className="gw-container">
          <div className="gw-approved" style={{ marginBottom: 28 }}>
            <div className="gw-stamp"><div className="gw-stamp__centre">GOOD<br />WORK.</div></div>
            <div>
              <p className="gw-label">Build + monthly</p>
              <h2 className="gw-h2" style={{ color: "var(--gw-white)" }}>The Content Console</h2>
            </div>
          </div>
          <p className="gw-body-large gw-max-copy" style={{ marginBottom: 16 }}>
            One dashboard that keeps a business looking active, without anyone sitting down to write it.
          </p>
          <p className="gw-body gw-max-copy" style={{ marginBottom: 8 }}>
            Most small businesses go quiet online not because they don't see the point, but because writing posts
            comes last after a full day on site. The Console does the drafting from what you've already told us
            about the business — you review it, change what you want, and schedule it. Ten minutes a week instead
            of an agency retainer.
          </p>
          <ul className="gw-features gw-features--detail">
            {CONSOLE_MODULES.map((m) => (
              <li key={m.name}>
                <strong>{m.name}</strong>
                <span>{m.note}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="gw-section">
        <div className="gw-container">
          <p className="gw-label" style={{ marginBottom: 10 }}>How it runs</p>
          <h2 className="gw-h2">What actually happens</h2>
          <p className="gw-body gw-max-copy gw-text-muted" style={{ marginTop: 12, marginBottom: 8 }}>
            Four steps, no agency theatre. You'll know the price and the scope before we start building.
          </p>
          <div style={{ marginTop: 20 }}>
            {PROCESS.map((p) => (
              <div className="gw-addon" key={p.mark}>
                <div className="gw-addon-mark">{p.mark}</div>
                <div className="gw-addon-body">
                  <strong>{p.title}</strong>
                  <span>{p.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer statement="Make your business look as good as it actually is" />
    </>
  );
}
