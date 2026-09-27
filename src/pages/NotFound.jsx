import Seo from "../components/Seo";
import Button from "../components/Button";
import Headline from "../components/Headline";

export default function NotFound() {
  return (
    <>
      <Seo title="Page not found" description="That page isn't here. Head to the Library, the pricing or get in touch." noindex />
      <section className="gw-section gw-gridbg">
        <div className="gw-container--narrow">
          <p className="gw-eyebrow gw-eyebrow--accent">Error 404</p>
          <Headline onMount className="gw-h1 gw-mt-2" lines={["That page", "isn't here."]} />
          <p className="gw-lead gw-max gw-mt-3">Either it moved or the link was wrong. Everything Goodwork sells is a couple of clicks away.</p>
          <div className="gw-actions gw-mt-4">
            <Button to="/" arrow>
              Back to home
            </Button>
            <Button to="/library" variant="secondary">
              Explore the Library
            </Button>
            <Button to="/pricing" variant="ghost">
              Compare every option
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
