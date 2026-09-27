import { Link, useSearchParams } from "react-router-dom";
import Seo from "../components/Seo";
import PageHeader from "../components/PageHeader";
import Reveal from "../components/Reveal";
import Button from "../components/Button";
import EnquiryForm from "../components/EnquiryForm";
import { AUTH_ENABLED } from "../lib/auth";
import { OFFER } from "../data/offers";
import { gbp } from "../lib/format";

/**
 * Customer sign-in.
 *
 * There is no authentication provider behind this deployment yet, and this
 * page says so instead of rendering a form that posts nowhere. The intended
 * flow (secure payment -> verified webhook -> entitlement -> account ->
 * server-authorised, expiring download links) is documented in
 * docs/BACKEND.md. When AUTH_ENABLED flips on, the sign-in form replaces
 * this notice.
 */
export default function Login() {
  const [params] = useSearchParams();
  const next = params.get("next");

  return (
    <>
      <Seo title="Sign in" description="Customer sign-in for Goodwork Library and Studio downloads." noindex />

      <PageHeader eyebrow="Customer access" lines={["Sign in."]} lead="Your dashboard shows the products your purchase covers and issues download links that are authorised on the server and expire." />

      <section className="gw-section--tight">
        <div className="gw-container">
          <div className="gw-split">
            <Reveal variant="rise" asChild>
              <div className="gw-card">
                {AUTH_ENABLED ? (
                  <p className="gw-body">Sign-in form goes here once a provider is wired. See src/lib/auth.js.</p>
                ) : (
                  <>
                    <div className="gw-notice gw-notice--info">
                      <strong>Accounts open with the Library release</strong>
                      <span>
                        Customer accounts, secure downloads and online checkout are being switched on together. Nothing on this page pretends
                        otherwise: there is no sign-in form yet because there is no account system behind it yet.
                      </span>
                    </div>
                    <h2 className="gw-h4 gw-mt-4">Tell me when accounts are live</h2>
                    <div className="gw-mt-2">
                      <EnquiryForm formId="access" compact source={next ? `login:${next}` : "login"} />
                    </div>
                  </>
                )}
              </div>
            </Reveal>
            <div style={{ display: "grid", gap: "1rem" }}>
              <Reveal variant="rise" delay={80} asChild>
                <div className="gw-card gw-card--flat">
                  <p className="gw-eyebrow">How access will work</p>
                  <ol className="gw-steps gw-mt-3">
                    <li><p className="gw-small gw-body">Choose Library ({gbp(OFFER.library.price)}) or Studio ({gbp(OFFER.studio.price)}) and read the licence and exclusions.</p></li>
                    <li><p className="gw-small gw-body">Pay through secure checkout. A verified payment event creates your entitlement.</p></li>
                    <li><p className="gw-small gw-body">Create or access your account; the dashboard shows only what your entitlement covers.</p></li>
                    <li><p className="gw-small gw-body">Downloads are authorised server-side with expiring links, and logged for security and support.</p></li>
                  </ol>
                </div>
              </Reveal>
              <Reveal variant="rise" delay={140} asChild>
                <div className="gw-card gw-card--flat">
                  <p className="gw-eyebrow">Meanwhile</p>
                  <p className="gw-small gw-body gw-mt-2">Browse the Library and its live previews, read the documentation, or talk to us about a build.</p>
                  <div className="gw-actions gw-mt-3">
                    <Button to="/library" variant="secondary" size="sm">
                      Explore the Library
                    </Button>
                    <Button to="/docs/getting-started" variant="ghost" size="sm">
                      Documentation
                    </Button>
                  </div>
                  {next && (
                    <p className="gw-small gw-muted gw-mt-3">
                      You were heading to <Link className="gw-link" to={next}>{next}</Link>.
                    </p>
                  )}
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
