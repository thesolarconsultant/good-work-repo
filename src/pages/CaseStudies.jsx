import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import { CASE_STUDIES } from "../data/caseStudies";

export default function CaseStudies() {
  return (
    <>
      <header className="gw-section--tight" style={{ paddingTop: "clamp(2.5rem,6vw,4rem)" }}>
        <div className="gw-container">
          <p className="gw-label" style={{ marginBottom: 14 }}>Case studies</p>
          <h1 className="gw-h1">What we've built<br />for people<span className="gw-dot"></span></h1>
          <p className="gw-body-large gw-max-copy gw-text-muted" style={{ marginTop: 18 }}>
            Two energy businesses, two very different problems. Every screenshot below is the real site,
            and every claim is something you can go and click on.
          </p>
        </div>
      </header>

      <hr className="gw-rule--gradient" style={{ border: 0 }} />

      {CASE_STUDIES.map((cs, i) => (
        <div key={cs.id}>
          <section className="gw-section" id={cs.id}>
            <div className="gw-container">
              <div className="gw-case-head">
                <div className="gw-case-accent" style={{ background: cs.accent }} aria-hidden="true"></div>
                <div>
                  <p className="gw-label">{cs.sector}</p>
                  <h2 className="gw-h2" style={{ marginTop: 6 }}>{cs.name}</h2>
                  <p className="gw-case-site">
                    {cs.site} <span aria-hidden="true">·</span> {cs.tag}
                  </p>
                </div>
              </div>

              <p className="gw-body-large gw-max-copy" style={{ marginTop: 24 }}>{cs.lede}</p>

              <div className="gw-facts">
                {cs.facts.map((f) => (
                  <div className="gw-fact" key={f.label}>
                    <span className="gw-fact__figure">{f.figure}</span>
                    <span className="gw-fact__label">{f.label}</span>
                  </div>
                ))}
              </div>

              <figure className="gw-shot gw-shot--lead">
                <img src={cs.shots[0].src} alt={`${cs.name} — ${cs.shots[0].caption}`} loading="lazy" />
                <figcaption>{cs.shots[0].caption}</figcaption>
              </figure>

              <div className="gw-case-body">
                <div>
                  <p className="gw-label" style={{ marginBottom: 10 }}>The brief</p>
                  {cs.brief.map((p, idx) => (
                    <p className="gw-body gw-text-muted" style={{ marginBottom: 12 }} key={idx}>{p}</p>
                  ))}
                </div>
                <div>
                  <p className="gw-label" style={{ marginBottom: 10 }}>What we built</p>
                  <ul className="gw-features gw-features--detail" style={{ gridTemplateColumns: "1fr", marginTop: 0 }}>
                    {cs.built.map((b) => (
                      <li key={b.title}>
                        <strong>{b.title}</strong>
                        <span>{b.desc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="gw-shot-grid">
                {cs.shots.slice(1).map((s) => (
                  <figure className="gw-shot" key={s.src}>
                    <img src={s.src} alt={`${cs.name} — ${s.caption}`} loading="lazy" />
                    <figcaption>{s.caption}</figcaption>
                  </figure>
                ))}
              </div>

              <div className="gw-chips">
                <p className="gw-label" style={{ width: "100%", marginBottom: 4 }}>Services used</p>
                {cs.services.map((s) => (
                  <Link className="gw-chip" to="/services" key={s}>{s}</Link>
                ))}
              </div>
            </div>
          </section>
          {i < CASE_STUDIES.length - 1 && (
            <hr className="gw-rule" style={{ maxWidth: 1100, marginInline: "auto" }} />
          )}
        </div>
      ))}

      <Footer statement="This could be your project next" />
    </>
  );
}
