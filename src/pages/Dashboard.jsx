import { Link, Navigate } from "react-router-dom";
import Seo from "../components/Seo";
import PageHeader from "../components/PageHeader";
import Button from "../components/Button";
import { useSession } from "../lib/auth";
import { OFFER } from "../data/offers";
import { longDate } from "../lib/format";
import { CONTACT_EMAIL } from "../lib/site";
import { track, EVENTS } from "../lib/analytics";

/**
 * The customer dashboard. Protected: without a server-confirmed session it
 * sends the visitor to sign in. There is no client-side "unlock": everything
 * rendered here came back from /api/access, and each download link goes to
 * /api/download, which checks the key again before it serves a byte.
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
  const downloadsFor = (productId) => session.downloads.filter((d) => d.product === productId);

  return (
    <>
      <Seo title="Your dashboard" description="Your Goodwork products and downloads." noindex />
      <PageHeader
        eyebrow="Dashboard"
        lines={[`Hello${session.user?.name && !session.user.name.includes("@") ? `, ${session.user.name}` : ""}.`]}
        lead="Everything your access covers. Each download is authorised on the server when you click it, and logged for security and support."
      />
      <section className="gw-section--tight">
        <div className="gw-container">
          <div className="gw-grid gw-grid--2">
            {[OFFER.library, OFFER.studio].map((o) => {
              const has = owned.has(o.id);
              const downloads = downloadsFor(o.id);
              return (
                <div key={o.id} className={`gw-card${has ? " gw-card--accent" : ""}`}>
                  <p className={`gw-eyebrow${has ? " gw-eyebrow--accent" : ""}`}>{has ? "Included in your access" : "Not in your access"}</p>
                  <h2 className="gw-h3 gw-mt-1">{o.name}</h2>
                  <p className="gw-small gw-body gw-mt-2">{o.line}</p>

                  {has && downloads.length > 0 && (
                    <ul className="gw-list gw-list--plain gw-mt-3">
                      {downloads.map((d) => (
                        <li key={d.product}>
                          <Button href={d.href} download={d.filename} block onClick={() => track(EVENTS.DOWNLOAD, { product: d.product, version: d.version })}>
                            Download {d.name} <span aria-hidden="true">↓</span>
                          </Button>
                          <p className="gw-small gw-muted gw-mt-2">
                            <span className="gw-mono">v{d.version}</span> · {d.items} components · updated {longDate(d.updated)} · {d.filename}
                          </p>
                          <p className="gw-small gw-body gw-mt-1">{d.note}</p>
                        </li>
                      ))}
                    </ul>
                  )}

                  {has && o.id === "studio" && (
                    <div className="gw-mt-3">
                      <p className="gw-small gw-body">Your components, sections and templates are in the Library download on the left.</p>
                      {session.pending.map((note) => (
                        <div key={note} className="gw-notice gw-notice--info gw-mt-2">
                          <strong>Still to ship</strong>
                          <span>{note}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {!has && (
                    <div className="gw-mt-3">
                      <Button to={o.route} variant="secondary" arrow>
                        See {o.short}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="gw-grid gw-grid--2 gw-mt-4">
            <div className="gw-card gw-card--flat">
              <p className="gw-eyebrow">Your access</p>
              <dl className="gw-kv gw-mt-3">
                <dt>Signed in as</dt>
                <dd>{session.user?.name || "Access key holder"}</dd>
                <dt>Key id</dt>
                <dd className="gw-mono">{session.user?.id}</dd>
                <dt>Covers</dt>
                <dd>{session.entitlements.map((e) => OFFER[e.productId]?.name || e.productId).join(", ")}</dd>
              </dl>
              <p className="gw-small gw-body gw-mt-3">
                Your access key is your licence: one key per purchase, and it stays private. Sharing it is grounds for suspension under the{" "}
                <Link className="gw-link" to="/legal/acceptable-use">acceptable-use rules</Link>. Everything you download stays yours under the{" "}
                <Link className="gw-link" to="/legal/licence">commercial licence</Link>.
              </p>
              <div className="gw-actions gw-mt-3">
                <Button variant="ghost" size="sm" onClick={() => session.signOut()}>
                  Sign out
                </Button>
              </div>
            </div>
            <div className="gw-card gw-card--flat">
              <p className="gw-eyebrow">Help</p>
              <ul className="gw-list gw-list--tight gw-mt-3">
                <li>
                  <Link className="gw-link" to="/docs/getting-started">Getting started</Link>: from the download to a live page.
                </li>
                <li>
                  <Link className="gw-link" to="/docs/brand-tokens">Brand tokens</Link>: recolour every component in one place.
                </li>
                <li>
                  <Link className="gw-link" to="/docs/installing-components">Installing components</Link>: paste, adjust, ship.
                </li>
                <li>
                  Something wrong with your access? Email <a className="gw-link" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> from the address you bought with.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
