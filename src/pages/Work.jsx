import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import { CASE_STUDIES } from "../data/caseStudies";

export default function Work() {
  return (
    <>
      <header className="gw-section--tight" style={{ paddingTop: "clamp(2.5rem,6vw,4rem)" }}>
        <div className="gw-container">
          <p className="gw-label" style={{ marginBottom: 14 }}>Selected work</p>
          <h1 className="gw-h1">Recent projects</h1>
          <p className="gw-body-large gw-max-copy gw-text-muted" style={{ marginTop: 16 }}>
            Brand, web and systems work for two UK energy businesses — both live, both still running.
          </p>
          <Link to="/case-studies" className="gw-button" style={{ marginTop: 28 }}>
            Read the case studies →
          </Link>
        </div>
      </header>

      {CASE_STUDIES.map((cs, i) => (
        <div key={cs.id}>
          <section className="gw-section" id={cs.id}>
            <div className="gw-container">
              <div className="gw-case-body" style={{ alignItems: "center" }}>
                <figure className="gw-shot" style={{ order: i % 2 === 0 ? 1 : 2 }}>
                  <img src={cs.shots[0].src} alt={`${cs.name} homepage`} loading="lazy" />
                </figure>
                <div style={{ order: i % 2 === 0 ? 2 : 1 }}>
                  <span className="gw-work-card__tag">{cs.tag}</span>
                  <h2 className="gw-h2" style={{ marginTop: 6 }}>{cs.name}</h2>
                  <p className="gw-case-site">{cs.site}</p>
                  <p className="gw-body gw-text-muted" style={{ marginTop: 14 }}>{cs.lede}</p>
                  <div className="gw-facts" style={{ gridTemplateColumns: "1fr 1fr", margin: "24px 0" }}>
                    {cs.facts.slice(0, 2).map((f) => (
                      <div className="gw-fact" key={f.label}>
                        <span className="gw-fact__figure">{f.figure}</span>
                        <span className="gw-fact__label">{f.label}</span>
                      </div>
                    ))}
                  </div>
                  <Link to={`/case-studies#${cs.id}`} className="gw-button gw-button--outline">
                    See the full case study →
                  </Link>
                </div>
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
