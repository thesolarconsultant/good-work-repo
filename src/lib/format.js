// Money and label formatting, UK style. Every price on the site goes through
// here so "£8,888.88" and "£28/month" are never typed by hand twice.

const GBP = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** 280 -> "£280", 8888.88 -> "£8,888.88" */
export function gbp(amount) {
  const n = Number(amount);
  const hasPence = Math.round(n * 100) % 100 !== 0;
  return GBP.format(n).replace(/\.00$/, "") + (hasPence ? "" : "");
}

/** 1700, 5300 -> "£1,700–£5,300"; a single figure when there is no upper one. */
export function gbpRange(from, to) {
  return to && to !== from ? `${gbp(from)}–${gbp(to)}` : gbp(from);
}

/** An offer's figure as shown: "£280", or "£1,700–£5,300" for one priced as a range. */
export const offerAmount = (offer) => gbpRange(offer.price, offer.priceTo);

/** "one-time" | "monthly" -> the words the brief insists on. */
export function billingWord(billing) {
  return billing === "monthly" ? "per month" : "one-time";
}

/** "£280 one-time", "£28 per month" */
export function priceLabel(amount, billing) {
  return `${gbp(amount)} ${billingWord(billing)}`;
}

/** "£28/month" for tight table cells. */
export function priceShort(amount, billing) {
  return billing === "monthly" ? `${gbp(amount)}/month` : `${gbp(amount)} once`;
}

/** 2026-09-26 -> "26 September 2026" */
export function longDate(iso) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
