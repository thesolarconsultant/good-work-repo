// SHELVED — the Foundation / Grow / Scale packages are temporarily off the site.
// Nothing imports this file. Kept so the tiers can be put back without rewriting
// the copy; re-render them on the Services page when pricing is settled.

export const TIERS = [
  {
    name: "Foundation",
    sub: "One-time build",
    price: "£750–£1,250",
    priceSmall: null,
    desc: "The essentials, done properly — a site you're happy to hand out, a look that holds together, and the listings customers check before they call.",
    who: "A business that's already winning work but has nothing solid online — no website, or one built years ago on a free template that nobody has touched since.",
    includesPrev: null,
    features: [
      { name: "Custom website", note: "Hand-built, not a template. The pages your customers actually need, fast on a phone, and structured so Google can read it." },
      { name: "Brand refresh — logo, colour, type", note: "Your existing look tidied into something consistent: a cleaned-up logo, a defined palette and a typeface pairing, supplied as files you own." },
      { name: "Google & Meta business verification", note: "Google Business Profile and Meta pages claimed, verified and filled in properly, so you appear in local search and maps with the right details." },
      { name: "Email signature strip", note: "One signature for everyone in the business — name, role, number, logo — so email looks like it came from a company, not a phone." },
      { name: "Starter email templates", note: "The messages you send constantly, written once: quote follow-up, booking confirmation, job complete, review request." },
    ],
    variant: "default",
  },
  {
    name: "Grow",
    sub: "Build + monthly",
    price: "£1,500–£2,250",
    priceSmall: "+ £150–250/mo",
    desc: "A full identity rather than a tidy-up, plus the Content Console — the engine that keeps something going out under your name every week without you sitting down to write it.",
    who: "A business that wins on word of mouth and now needs to stay visible between jobs, without hiring someone to run marketing.",
    includesPrev: "Everything in Foundation, plus:",
    features: [
      { name: "Full brand identity", note: "Logo suite, complete palette, type scale, photography direction and written rules — so everything stays consistent as staff, signage and suppliers multiply." },
      { name: "Social accounts set up & seeded", note: "Profiles built on the platforms worth being on, with the first 5–10 posts already live so nobody lands on an empty page." },
      { name: "The Content Console", note: "Your own dashboard for blogs, social posts, emails and WhatsApp replies. Drafted for you, approved and scheduled by you." },
      { name: "GA4 setup", note: "Analytics configured around the things that matter — calls, form fills, WhatsApp taps — so you can see which marketing actually pays." },
      { name: "ID badges / staff cards", note: "Branded ID for anyone turning up at a customer's door. Cheap to produce, and a disproportionate effect on how you're received." },
    ],
    variant: "soft",
  },
  {
    name: "Scale",
    sub: "Build + full retainer",
    price: "£3,000–£4,500",
    priceSmall: "+ £400–750/mo",
    desc: "The business keeps selling while you're on the tools. Enquiries get answered, qualified, quoted, contracted and chased automatically — you set the prices and turn up to the job.",
    who: "A team losing real money to admin: calls missed during jobs, quotes taking days to go out, and leads quietly going elsewhere while they wait.",
    includesPrev: "Everything in Grow, plus:",
    features: [
      { name: "Always-on WhatsApp booking & qualifying", note: "A number that replies instantly at 9pm on a Sunday, asks the questions you'd ask, and puts a real appointment in the diary." },
      { name: "Missed-call answering & callback booking", note: "Unanswered calls get picked up, the caller is offered a callback slot or moved to WhatsApp, and the details land with you. No lead goes cold overnight." },
      { name: "Quick quoting & contracting app, white-labelled", note: "Your pricing built into an app under your own name: pick the job, get a live price, send a quote that turns into a contract and a deposit link." },
      { name: "Contracts — wording & design", note: "Terms written for your trade and laid out so customers actually read and sign them — not a PDF borrowed from another company." },
      { name: "Meta ads: setup, running, optimising, reporting", note: "Campaigns built, launched and managed month to month, with a plain-English report on spend, leads and what each one cost." },
    ],
    variant: "outline-dark",
  },
];
