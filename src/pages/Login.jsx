import { useEffect, useId, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import Seo from "../components/Seo";
import PageHeader from "../components/PageHeader";
import Reveal from "../components/Reveal";
import Button from "../components/Button";
import EnquiryForm from "../components/EnquiryForm";
import { useSession } from "../lib/auth";
import { OFFER } from "../data/offers";
import { gbp } from "../lib/format";
import { CONTACT_EMAIL } from "../lib/site";

/**
 * Customer sign-in with an access key.
 *
 * The key is checked by /api/access, which sets an HttpOnly cookie; nothing is
 * stored or decided in the browser. Until the server can honour keys the
 * endpoint answers 503 and this page says so, taking an email instead of
 * showing a form that cannot work. See docs/BACKEND.md.
 *
 * Checkout used to return here; a link carrying a Stripe session id is sent
 * on to /welcome, which confirms the payment and issues the key.
 */
export default function Login() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const uid = useId();
  const next = params.get("next");
  const destination = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  const checkoutSession = params.get("session_id");
  const session = useSession({ probe: true });
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Already signed in and sent here on the way somewhere: carry on there.
  useEffect(() => {
    if (session.status === "authenticated" && next) navigate(destination, { replace: true });
  }, [session.status, next, destination, navigate]);

  async function submit(event) {
    event.preventDefault();
    const trimmed = key.trim();
    if (!trimmed) {
      setError("Enter your access key.");
      return;
    }
    setBusy(true);
    setError("");
    const result = await session.signIn(trimmed);
    setBusy(false);
    if (result.ok) {
      navigate(destination, { replace: true });
      return;
    }
    setError(result.error);
  }

  const checking = !session.asked && session.status !== "authenticated";

  if (checkoutSession) return <Navigate to={`/welcome?session_id=${encodeURIComponent(checkoutSession)}`} replace />;

  return (
    <>
      <Seo title="Sign in" description="Customer sign-in for Goodwork Library and Studio downloads." noindex />

      <PageHeader eyebrow="Customer access" lines={["Sign in."]} lead="Your access key is your licence. Sign in with it and your dashboard lists the downloads it covers, each one authorised on the server when you ask for it." />

      <section className="gw-section--tight">
        <div className="gw-container">
          <div className="gw-split">
            <Reveal variant="rise" asChild>
              <div className="gw-card">
                {session.status === "authenticated" ? (
                  <>
                    <p className="gw-eyebrow gw-eyebrow--accent">Signed in</p>
                    <h2 className="gw-h3 gw-mt-2">You have access{session.user?.name ? `, ${session.user.name}` : ""}.</h2>
                    <p className="gw-body gw-mt-2">
                      Your dashboard lists the downloads your key covers
                      {session.entitlements.length ? ` (${session.entitlements.map((e) => OFFER[e.productId]?.short || e.productId).join(", ")})` : ""}.
                    </p>
                    <div className="gw-actions gw-mt-4">
                      <Button to="/dashboard" arrow>
                        Go to your dashboard
                      </Button>
                      <Button variant="ghost" onClick={() => session.signOut()}>
                        Sign out
                      </Button>
                    </div>
                  </>
                ) : checking ? (
                  <div className="gw-route-loading gw-route-loading--inline" role="status" aria-label="Checking whether sign-in is available">
                    <span className="gw-spinner" aria-hidden="true" />
                  </div>
                ) : session.configured === false ? (
                  <>
                    <div className="gw-notice gw-notice--info">
                      <strong>Customer access isn't switched on yet</strong>
                      <span>
                        Sign-in and downloads are being switched on with the Library release. Nothing on this page pretends otherwise: there is no
                        form here because the server isn't taking keys yet.
                      </span>
                    </div>
                    <h2 className="gw-h4 gw-mt-4">Tell me when it's live</h2>
                    <div className="gw-mt-2">
                      <EnquiryForm formId="access" compact source={next ? `login:${next}` : "login"} />
                    </div>
                  </>
                ) : (
                  <form onSubmit={submit} noValidate aria-busy={busy}>
                    <div className="gw-field">
                      <label className="gw-field__label" htmlFor={`${uid}-key`}>
                        Access key
                        <span className="gw-field__req" aria-hidden="true">
                          *
                        </span>
                      </label>
                      <span className="gw-field__hint" id={`${uid}-hint`}>
                        The key shown after you paid, or the one we emailed you. Keys are case-sensitive.
                      </span>
                      <input
                        id={`${uid}-key`}
                        className="gw-input gw-mono"
                        name="key"
                        type="text"
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        autoComplete="off"
                        autoCapitalize="off"
                        autoCorrect="off"
                        spellCheck={false}
                        required
                        aria-required="true"
                        aria-invalid={error ? "true" : undefined}
                        aria-describedby={`${uid}-hint${error ? ` ${uid}-error` : ""}`}
                      />
                      {error && (
                        <span className="gw-field__error" id={`${uid}-error`} role="alert">
                          {error}
                        </span>
                      )}
                    </div>
                    <div className="gw-actions gw-mt-3">
                      <Button type="submit" arrow disabled={busy}>
                        {busy ? "Checking…" : "Sign in"}
                      </Button>
                    </div>
                    <p className="gw-small gw-muted gw-mt-3">
                      Lost your key? Email <a className="gw-link" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> from the address you bought with.
                    </p>
                  </form>
                )}
              </div>
            </Reveal>

            <div style={{ display: "grid", gap: "1rem" }}>
              <Reveal variant="rise" delay={80} asChild>
                <div className="gw-card gw-card--flat">
                  <p className="gw-eyebrow">How access works</p>
                  <ol className="gw-steps gw-mt-3">
                    <li><p className="gw-small gw-body">Choose Library ({gbp(OFFER.library.price)}) or Studio ({gbp(OFFER.studio.price)}) and read the licence and exclusions.</p></li>
                    <li><p className="gw-small gw-body">Pay through secure checkout. Your access comes from Stripe confirming the payment to our server, never from the page you land on.</p></li>
                    <li><p className="gw-small gw-body">Straight after paying you're signed in and shown your access key. It's your licence: one key per purchase, and it stays private.</p></li>
                    <li><p className="gw-small gw-body">Sign in here. The dashboard lists only what your key covers, and every download is authorised on the server and logged.</p></li>
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
                  {next && session.status !== "authenticated" && (
                    <p className="gw-small gw-muted gw-mt-3">
                      You were heading to <Link className="gw-link" to={destination}>{destination}</Link>.
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
