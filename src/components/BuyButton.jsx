import { useState } from "react";
import Button from "./Button";
import EnquiryForm from "./EnquiryForm";
import { track, EVENTS } from "../lib/analytics";

/**
 * Direct purchase for Library and Studio.
 *
 * Calls /api/checkout, which creates a Stripe Checkout Session server-side
 * when payment credentials are configured and redirects the browser to it.
 * When it isn't configured the endpoint answers 503, and instead of
 * pretending, this shows exactly that and offers to take an email for when
 * checkout is live. No payment is ever simulated.
 */
export default function BuyButton({ productId, label, size = "lg", block = false, variant = "primary" }) {
  const [state, setState] = useState("idle"); // idle | starting | unavailable | failed
  const [message, setMessage] = useState("");

  async function start() {
    setState("starting");
    track(EVENTS.CHECKOUT_START, { product: productId });
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: productId, path: window.location.pathname }),
      });
      const body = await response.json().catch(() => ({}));
      if (response.ok && body.url) {
        window.location.assign(body.url);
        return;
      }
      if (response.status === 503 || response.status === 404) {
        setState("unavailable");
        track(EVENTS.CHECKOUT_UNAVAILABLE, { product: productId, status: response.status });
        return;
      }
      throw new Error(body.error || `Checkout returned ${response.status}.`);
    } catch (err) {
      setState("failed");
      setMessage(err.message || "Checkout could not start.");
    }
  }

  return (
    <div style={{ display: "grid", gap: "0.9rem" }}>
      <Button variant={variant} size={size} block={block} arrow onClick={start} disabled={state === "starting"} aria-busy={state === "starting"}>
        {state === "starting" ? "Opening secure checkout…" : label}
      </Button>

      {state === "unavailable" && (
        <div className="gw-card gw-card--accent" role="status" aria-live="polite">
          <p className="gw-eyebrow gw-eyebrow--accent">Checkout not switched on yet</p>
          <p className="gw-body gw-mt-1">
            Online payment for this product is being enabled with the Library release. Nothing has been charged.
            Leave an email and we'll tell you the moment it's live.
          </p>
          <div className="gw-mt-3">
            <EnquiryForm formId="access" compact prefill={{ product: productId }} source="buy-button" />
          </div>
        </div>
      )}

      {state === "failed" && (
        <div className="gw-alert" role="alert">
          <strong>Checkout didn't start.</strong>
          <span>{message}</span>
          <span>
            Try again in a moment, or email <a className="gw-link" href="mailto:hello@goodwork.agency">hello@goodwork.agency</a>.
          </span>
        </div>
      )}
    </div>
  );
}
