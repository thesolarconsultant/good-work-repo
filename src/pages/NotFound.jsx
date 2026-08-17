import Button from "../components/Button";
import Footer from "../components/Footer";
import Headline from "../components/Headline";
import Reveal from "../components/Reveal";
import Seo from "../components/Seo";

export default function NotFound() {
  return (
    <>
      <Seo
        title="Page not found"
        description="That page isn't here. Head back to the work, the services or get in touch."
        noindex
      />

      <header className="gw-section gw-hero" style={{ paddingTop: "clamp(3rem,8vw,6rem)" }}>
        <div className="gw-aurora" aria-hidden="true">
          <span /><span /><span /><span />
        </div>
        <div className="gw-container">
          <p className="gw-label gw-pulse">Error 404</p>
          <Headline
            onMount
            className="gw-h1 gw-stack-md"
            lines={["That page isn't", <>here<span className="gw-dot" /></>]}
          />
          <Reveal variant="rise" delay={240}>
            <p className="gw-body-large gw-max-copy gw-text-muted gw-stack-lg">
              Either it moved or the link was wrong. Everything we've built is a couple of
              clicks away.
            </p>
          </Reveal>
          <Reveal variant="rise" delay={340}>
            <div className="gw-actions gw-stack-lg">
              <Button to="/" arrow>Back to home</Button>
              <Button to="/case-studies" variant="outline">See the work</Button>
            </div>
          </Reveal>
        </div>
      </header>

      <Footer statement="Got something worth making better" />
    </>
  );
}
