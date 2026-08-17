import Footer from "../components/Footer";

const CASE_STUDIES = [
  {
    id: "tsc",
    name: "The Solar Consultant",
    tag: "Brand · Web · Ads",
    gradient: "linear-gradient(135deg,#3366FF,#7A5CFF)",
    paragraphs: [
      "An independent UK solar advisory business positioned against the installer-led sales model — charging homeowners an advisory fee, designing systems from real consumption data, and matching them with vetted installers.",
      "Full brand identity, typography and motion system, plus a single clean funnel from free roof scan through to paid advisory report.",
    ],
    mediaFirst: true,
  },
  {
    id: "8energy",
    name: "8energy",
    tag: "Web · Systems",
    gradient: "linear-gradient(135deg,#7A5CFF,#FF2DB3)",
    paragraphs: [
      "A UK home energy technology brand covering solar, batteries, heat pumps and air conditioning. Built with scroll-triggered motion, live count-up statistics and a physics-based draggable logo carousel.",
      "Includes a reusable multi-step lead capture form designed to qualify enquiries before they reach the sales team.",
    ],
    mediaFirst: false,
  },
  {
    id: "harding",
    name: "Harding Waste Co.",
    tag: "Brand · Web",
    gradient: "linear-gradient(135deg,#FF2DB3,#FF6B5E)",
    paragraphs: [
      "A full brand and website build for a waste management company, built around a petrol and brass palette to feel more industrial and considered than the category norm.",
    ],
    mediaFirst: true,
  },
  {
    id: "ama",
    name: "AMA Scaffolding",
    tag: "Creative",
    gradient: "linear-gradient(135deg,#3366FF,#FF6B5E)",
    paragraphs: [
      "Branded, animated content assets for an Epping-based scaffolding contractor — built to travel well on social and stand out from the usual trade-page look.",
    ],
    mediaFirst: false,
  },
];

export default function Work() {
  return (
    <>
      <header className="gw-section--tight" style={{ paddingTop: "clamp(2.5rem,6vw,4rem)" }}>
        <div className="gw-container">
          <p className="gw-label" style={{ marginBottom: 14 }}>Selected work</p>
          <h1 className="gw-h1">Recent projects</h1>
          <p className="gw-body-large gw-max-copy gw-text-muted" style={{ marginTop: 16 }}>
            A mix of brand, web and systems work across trades, energy and independent service businesses.
          </p>
        </div>
      </header>

      {CASE_STUDIES.map((cs, i) => (
        <div key={cs.id}>
          <section className="gw-section" id={cs.id}>
            <div className="gw-container">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "center" }}>
                <div
                  className="gw-work-card__media"
                  style={{
                    order: cs.mediaFirst ? 1 : 2,
                    background: cs.gradient,
                    aspectRatio: "16/10",
                    borderRadius: "var(--gw-radius-lg)",
                    fontSize: "1.6rem",
                  }}
                >
                  {cs.name}
                </div>
                <div style={{ order: cs.mediaFirst ? 2 : 1 }}>
                  <span className="gw-work-card__tag">{cs.tag}</span>
                  <h2 className="gw-h2" style={{ marginTop: 6 }}>{cs.name}</h2>
                  {cs.paragraphs.map((p, idx) => (
                    <p className="gw-body gw-text-muted" style={{ marginTop: idx === 0 ? 14 : 10 }} key={idx}>{p}</p>
                  ))}
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
