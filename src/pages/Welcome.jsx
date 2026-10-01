import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Seo from "../components/Seo";
import PageHeader from "../components/PageHeader";
import Reveal from "../components/Reveal";
import Button from "../components/Button";
import { useSession } from "../lib/auth";
import { OFFER } from "../data/offers";
import { CONTACT_EMAIL } from "../lib/site";
import { track, EVENTS } from "../lib/analytics";

/**
 * Where Stripe sends a customer after paying: /welcome?session_id=cs_….
 *
 * The page doesn't believe the URL. It posts the session id to /api/claim,
 * which asks Stripe whether that session is paid before issuing a key; only
 * then does this show "you're in". The key is shown once here, with a copy
 * button, because it is the customer's licence; the same call has already
 * signed this browser in, so the download works straight away.
 *
 * Every other outcome says plainly what happened: still confirming (bank
 * payments can lag), automatic access not switched on (the key follows by
 * email), or a reference that doesn't check out.
 */
export default function Welcome() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id") || "";
  const session = useSession();
  const [state, setState] = useState(sessionId ? "checking" : "none"); // none | checking | ready | pending | unconfigured | failed
  const [claim, setClaim] = useState(null);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const asked = useRef(false);
  const keyRef = useRef(null);

  async function confirm() {
    setState("checking");
    try {
      const response = await fetch("/api/claim", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const body = await response.json().catch(() => ({}));
      if (response.ok && body.ok) {
        setClaim(body);
        setState("ready");
        track(EVENTS.PURCHASE_CONFIRMED, { product: body.product });
        session.refresh();
        return;
      }
      setMessage(body.error || "");
      if (response.status === 409) setState("pending");
      else if (response.status === 503 || (response.status === 404 && !body.error)) setState("unconfigured");
      else setState("failed");
    } catch {
      setMessage("We couldn't reach the server. Refresh in a moment: nothing is lost.");
      setState("failed");
    }
  }

  useEffect(() => {
    if (!sessionId || asked.current) return;
    asked.current = true;
    confirm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(claim.key);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      // No clipboard permission: select the key so it can be copied by hand.
      const range = document.createRange();
      range.selectNodeContents(keyRef.current);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  const product = claim ? OFFER[claim.product] : null;
  const first = claim?.name ? claim.name.trim().split(/\s+/)[0] : "";
  const lead =
    state === "ready"
      ? `${product?.name || "Your purchase"} is yours. You're signed in on this device, and the key below is your licence.`
      : state === "checking"
        ? "Confirming your payment with Stripe. This takes a moment."
        : "Thanks for buying from Goodwork.";

  return (
    <>
      <Seo title="Your purchase" description="Your Goodwork purchase and access key." noindex />

      <PageHeader eyebrow="Your purchase" lines={[state === "ready" ? "You're in." : "Thank you."]} lead={lead} />

      <section className="gw-section--tight">
        <div className="gw-container">
          <div className="gw-split">
            <Reveal variant="rise" asChild>
              <div className="gw-card" aria-live="polite">
                {state === "checking" && (
                  <div className="gw-route-loading gw-route-loading--inline" role="status">
                    <span className="gw-spinner" aria-hidden="true" />
                    <span className="gw-sr-only">Confirming your payment with Stripe</span>
                  </div>
                )}

                {state === "ready" && claim && (
                  <>
                    <p className="gw-eyebrow gw-eyebrow--accent">Payment confirmed</p>
                    <h2 className="gw-h3 gw-mt-2">
                      {first ? `Thanks, ${first}. ` : ""}
                      {product?.name || "Your purchase"} is yours.
                    </h2>
                    <div className="gw-keybox">
                      <span className="gw-keybox__label" id="welcome-key-label">
                        Your access key
                      </span>
                      <div className="gw-keybox__row">
                        <code className="gw-keybox__key" ref={keyRef} aria-labelledby="welcome-key-label">
                          {claim.key}
                        </code>
                        <Button size="sm" variant="secondary" onClick={copy}>
                          {copied ? "Copied" : "Copy key"}
                        </Button>
                      </div>
                    </div>
                    <p className="gw-small gw-muted gw-mt-2">
                      Keep it somewhere safe and private: it's how you sign in on any other device, and it's your licence. One key per purchase.
                      {claim.email ? ` Bought with ${claim.email}.` : ""}
                    </p>
                    <div className="gw-actions gw-mt-4">
                      <Button href="/api/download?product=library" arrow>
                        Download the Library
                      </Button>
                      <Button to="/dashboard" variant="secondary">
                        Go to your dashboard
                      </Button>
                    </div>
                    {claim.products?.includes("studio") && (
                      <p className="gw-small gw-muted gw-mt-3">Studio includes the Library. The Studio systems are released in stages and appear in your dashboard as they ship.</p>
                    )}
                  </>
                )}

                {state === "pending" && (
                  <>
                    <div className="gw-notice gw-notice--info">
                      <strong>Still confirming</strong>
                      <span>{message || "Your payment hasn't been confirmed yet. Some payment methods take a little longer."}</span>
                    </div>
                    <div className="gw-actions gw-mt-3">
                      <Button onClick={confirm} arrow>
                        Check again
                      </Button>
                    </div>
                  </>
                )}

                {state === "unconfigured" && (
                  <div className="gw-notice gw-notice--info">
                    <strong>Your key follows by email</strong>
                    <span>
                      {message || "Automatic access isn't switched on yet."} If anything looks wrong, email{" "}
                      <a className="gw-link" href={`mailto:${CONTACT_EMAIL}`}>
                        {CONTACT_EMAIL}
                      </a>
                      .
                    </span>
                  </div>
                )}

                {state === "failed" && (
                  <>
                    <div className="gw-alert" role="alert">
                      <strong>We couldn't confirm that purchase.</strong>
                      <span>{message}</span>
                      <span>
                        If you've paid, email{" "}
                        <a className="gw-link" href={`mailto:${CONTACT_EMAIL}`}>
                          {CONTACT_EMAIL}
                        </a>{" "}
                        with your Stripe receipt and we'll sort it.
                      </span>
                    </div>
                    <div className="gw-actions gw-mt-3">
                      <Button onClick={confirm} variant="secondary">
                        Try again
                      </Button>
                    </div>
                  </>
                )}

                {state === "none" && (
                  <>
                    <p className="gw-eyebrow gw-eyebrow--accent">Looking for your purchase?</p>
                    <h2 className="gw-h3 gw-mt-2">
                      {session.status === "authenticated" ? "You're signed in." : "Sign in with your access key."}
                    </h2>
                    <p className="gw-body gw-mt-2">
                      Straight after paying, Stripe brings you back here with a reference and your key appears on this page. Already have your key? Sign
                      in with it.
                    </p>
                    <div className="gw-actions gw-mt-4">
                      {session.status === "authenticated" ? (
                        <Button to="/dashboard" arrow>
                          Go to your dashboard
                        </Button>
                      ) : (
                        <Button to="/login" arrow>
                          Sign in
                        </Button>
                      )}
                      <Button to="/pricing" variant="secondary">
                        See the products
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </Reveal>

            <Reveal variant="rise" delay={80} asChild>
              <div className="gw-card gw-card--flat">
                <p className="gw-eyebrow">What next</p>
                <ol className="gw-steps gw-mt-3">
                  <li>
                    <p className="gw-small gw-body">Download the bundle: every component as a paste-ready file, an offline gallery with previews, and the licence.</p>
                  </li>
                  <li>
                    <p className="gw-small gw-body">
                      Start with <Link className="gw-link" to="/docs/getting-started">Getting started</Link>: from the download to a live page.
                    </p>
                  </li>
                  <li>
                    <p className="gw-small gw-body">
                      On another device, <Link className="gw-link" to="/login">sign in</Link> with your key. Your dashboard always has the latest version.
                    </p>
                  </li>
                </ol>
                <p className="gw-small gw-muted gw-mt-3">
                  What you can do with it: <Link className="gw-link" to="/legal/licence">the commercial licence</Link>.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
