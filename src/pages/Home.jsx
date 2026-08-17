import { Link } from "react-router-dom";
import Footer from "../components/Footer";

const WORK = [
  { to: "/work#tsc", name: "The Solar Consultant", tag: "Brand · Web", desc: "Independent solar advisory — full brand system and site.", gradient: "linear-gradient(135deg,#3366FF,#7A5CFF)" },
  { to: "/work#8energy", name: "8energy", tag: "Web · Systems", desc: "Home energy technology brand — animated site build.", gradient: "linear-gradient(135deg,#7A5CFF,#FF2DB3)" },
  { to: "/work#harding", name: "Harding Waste Co.", tag: "Brand · Web", desc: "Waste management brand identity and website.", gradient: "linear-gradient(135deg,#FF2DB3,#FF6B5E)" },
  { to: "/work#ama", name: "AMA Scaffolding", tag: "Creative", desc: "Branded animated assets for a growing scaffolding contractor.", gradient: "linear-gradient(135deg,#3366FF,#FF6B5E)" },
];

const DISCIPLINES = [
  { title: "Brand", desc: "Identity, positioning and messaging that make a business instantly recognisable." },
  { title: "Web", desc: "Websites and digital experiences built around one job: commercial outcomes." },
  { title: "Creative", desc: "Campaigns, content and advertising that actually gets looked at." },
  { title: "Systems", desc: "CRM, booking, quoting and content infrastructure that runs without you." },
];

export default function Home() {
  return (
    <>
      <header className="gw-section" style={{ paddingTop: "clamp(3.5rem,9vw,7rem)" }}>
        <div className="gw-container">
          <p className="gw-label" style={{ marginBottom: 18 }}>Brand · Web · Systems</p>
          <h1 className="gw-h1">We make businesses<br />look and work better<span className="gw-dot"></span></h1>
          <p className="gw-body-large gw-max-copy gw-text-muted" style={{ marginTop: 20 }}>
            Good businesses get let down by weak websites, disconnected systems and inconsistent marketing. We fix that — properly, once, then keep it running.
          </p>
          <div style={{ display: "flex", gap: 14, marginTop: 32, flexWrap: "wrap" }}>
            <Link to="/work" className="gw-button">View our work</Link>
            <Link to="/services" className="gw-button gw-button--outline">See services</Link>
          </div>
        </div>
      </header>

      <hr className="gw-rule--gradient" style={{ border: 0 }} />

      <section className="gw-section">
        <div className="gw-container">
          <p className="gw-label" style={{ marginBottom: 10 }}>What we do</p>
          <h2 className="gw-h2">Four disciplines. One standard.</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 32 }}>
            {DISCIPLINES.map((d) => (
              <div className="gw-card" key={d.title}>
                <h3 className="gw-h3">{d.title}</h3>
                <p className="gw-body gw-text-muted" style={{ marginTop: 10 }}>{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="gw-section gw-dark">
        <div className="gw-container">
          <p className="gw-label" style={{ marginBottom: 10 }}>Selected work</p>
          <h2 className="gw-h2">Recent projects</h2>
          <div className="gw-work-grid" style={{ marginTop: 32 }}>
            {WORK.map((w) => (
              <Link to={w.to} className="gw-work-card" key={w.name} style={{ borderColor: "rgba(255,255,255,0.15)", background: "#161616" }}>
                <div className="gw-work-card__media" style={{ background: w.gradient }}>{w.name}</div>
                <div className="gw-work-card__body">
                  <span className="gw-work-card__tag" style={{ color: "rgba(255,255,255,0.5)" }}>{w.tag}</span>
                  <p className="gw-body" style={{ color: "var(--gw-white)" }}>{w.desc}</p>
                </div>
              </Link>
            ))}
          </div>
          <Link to="/work" className="gw-button" style={{ marginTop: 32, background: "var(--gw-white)", color: "var(--gw-black)" }}>
            View all work
          </Link>
        </div>
      </section>

      <section className="gw-section">
        <div className="gw-container">
          <div className="gw-approved" style={{ marginBottom: 28 }}>
            <div className="gw-stamp"><div className="gw-stamp__centre">GOOD<br />WORK.</div></div>
            <div>
              <p className="gw-label">How we work</p>
              <h2 className="gw-h2">Understand. Think. Make. Improve.</h2>
            </div>
          </div>
          <p className="gw-body-large gw-max-copy gw-text-muted">
            No unnecessary agency process. We work out what matters, then we make it better — and keep making it better once it's live.
          </p>
        </div>
      </section>

      <Footer statement="Got something worth making better" />
    </>
  );
}
