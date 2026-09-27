import { Navigate } from "react-router-dom";
import Seo from "../components/Seo";
import PageHeader from "../components/PageHeader";
import Button from "../components/Button";
import { useSession } from "../lib/auth";
import { OFFER } from "../data/offers";

/**
 * The customer dashboard. Protected: without a server-issued session it
 * sends the visitor to sign in. There is no client-side "unlock", because a
 * dashboard that can be opened by editing localStorage protects nothing.
 */
export default function Dashboard() {
  const session = useSession();

  if (session.status === "loading") {
    return (
      <div className="gw-route-loading" role="status" aria-label="Checking your session">
        <span className="gw-spinner" aria-hidden="true" />
      </div>
    );
  }
  if (session.status !== "authenticated") {
    return <Navigate to="/login?next=/dashboard" replace />;
  }

  const owned = new Set(session.entitlements.map((e) => e.productId));
  return (
    <>
      <Seo title="Your dashboard" description="Your Goodwork products and downloads." noindex />
      <PageHeader eyebrow="Dashboard" lines={[`Hello${session.user?.name ? `, ${session.user.name}` : ""}.`]} lead="Everything your purchase covers, with download links issued on request and valid for a short time." />
      <section className="gw-section--tight">
        <div className="gw-container">
          <div className="gw-grid gw-grid--2">
            {[OFFER.library, OFFER.studio].map((o) => (
              <div key={o.id} className="gw-card">
                <p className="gw-eyebrow">{owned.has(o.id) ? "Included in your purchase" : "Not in your purchase"}</p>
                <h2 className="gw-h3 gw-mt-1">{o.name}</h2>
                <p className="gw-small gw-body gw-mt-2">{o.line}</p>
                <div className="gw-mt-3">
                  {owned.has(o.id) ? (
                    <Button variant="primary" disabled aria-disabled="true">
                      Request download link
                    </Button>
                  ) : (
                    <Button to={o.route} variant="secondary" arrow>
                      See {o.short}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
