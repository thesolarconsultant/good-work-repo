import { gbpRange, billingWord } from "../lib/format";

/** A price with its billing term always attached: "£280" + "one-time". `to` makes it a range: "£1,700–£5,300". */
export default function Price({ amount, to, billing = "one-time", size = "md", term, className = "" }) {
  return (
    <span className={`gw-price ${className}`.trim()}>
      <span className={`gw-price__amount${size !== "md" ? ` gw-price__amount--${size}` : ""}`}>{gbpRange(amount, to)}</span>
      <span className="gw-price__term">{term || billingWord(billing)}</span>
    </span>
  );
}
