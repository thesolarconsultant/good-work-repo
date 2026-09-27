import { gbp, billingWord } from "../lib/format";

/** A price with its billing term always attached: "£280" + "one-time". */
export default function Price({ amount, billing = "one-time", size = "md", term, className = "" }) {
  return (
    <span className={`gw-price ${className}`.trim()}>
      <span className={`gw-price__amount${size !== "md" ? ` gw-price__amount--${size}` : ""}`}>{gbp(amount)}</span>
      <span className="gw-price__term">{term || billingWord(billing)}</span>
    </span>
  );
}
