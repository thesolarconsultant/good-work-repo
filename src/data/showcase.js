// The showcase — real projects, written from what is in each client's
// repository, with screenshots of the built sites. Each entry states the
// original problem, what Goodwork created, which products or systems it used,
// and what a visitor can preview. Nothing here is a client result Goodwork
// has not verified, and status labels are honest about what is live.

import { CASE_STUDIES } from "./caseStudies";

const META = {
  tsc: {
    status: "Live",
    problem:
      "Three solar quotes, three different systems and no way for a homeowner to tell which is right. The business needed to sell paid, independent advice before anyone had heard of it, to two audiences at once.",
    created:
      "A twenty-route prerendered site with separate homeowner and installer journeys, a paid staged funnel, an always-on AI booking agent, a lead pipeline wired into the CRM, and a Content Console living inside the client's own portal.",
    systems: ["Website", "Brand guidelines", "AI booking agent", "Content Console", "CRM pipeline", "Automations"],
    preview: { label: "Visit thesolarconsultant.uk", href: "https://thesolarconsultant.uk" },
    demo: "agent",
  },
  "8energy": {
    status: "Live",
    problem:
      "One brand covering solar, batteries, heat pumps, EV charging and more, at risk of looking like a generalist in all of them.",
    created:
      "Thirty-four hand-built pages with a full argument for each service line, a free energy-analysis funnel, an AI agent behind the WhatsApp line, a projection calculator and a Content Studio on its own subdomain.",
    systems: ["Website", "Brand guidelines", "WhatsApp agent", "Content Console", "Calculator"],
    preview: { label: "Visit 8energy.uk", href: "https://8energy.uk" },
  },
  keystone: {
    status: "Built · pre-launch",
    problem:
      "A thirty-three-year-old contractor with no website at all, whose strongest claim, a 25-year written guarantee, nobody online could see.",
    created:
      "Ten trade pages off one dynamic route, a guarantee page that states the terms in writing, a Telegram bot that qualifies every lead while the crew is on a roof, and a twenty-piece print and merch system from the same brand file.",
    systems: ["Website", "Brand guidelines", "Telegram qualification bot", "Print system"],
    preview: null,
  },
  numio: {
    status: "Built",
    problem:
      "Most numerology products are one page selling one number. This one needed to be a real, installable product with an honest privacy model and a one-off payment.",
    created:
      "Nine reading sections in one profile, a PWA with a service worker and maskable icons, Stripe checkout for a single purchase, and an admin dashboard that aggregates patterns without storing anything personal.",
    systems: ["Website", "Brand", "Payments", "Installable app"],
    preview: null,
  },
  omniv: {
    status: "Built · pre-launch",
    problem:
      "A Netherlands installer with five service lines that each needed to stand alone, plus a bilingual content operation to run after launch.",
    created:
      "Five service pages sharing one scroll-driven lighting story, a bilingual content pipeline, a twenty-eight-email customer journey mapped with every unconfirmed fact flagged inline, and thirty launch carousels.",
    systems: ["Website", "Brand guidelines", "Content pipeline", "Email journey", "Social system"],
    preview: null,
  },
};

export const SHOWCASE = CASE_STUDIES.map((cs) => ({
  ...cs,
  ...META[cs.id],
}));

export const SHOWCASE_BY_ID = Object.fromEntries(SHOWCASE.map((s) => [s.id, s]));

/** Product demonstrations — things on this site a visitor can actually open. */
export const DEMOS = [
  {
    id: "library",
    name: "The Library, live",
    kind: "Product demonstration",
    copy: "Every component and section in the Goodwork Library renders live in a sandboxed preview. Filter it, open one, read the code it ships with.",
    to: "/library",
    cta: "Open the Library",
  },
  {
    id: "starter",
    name: "Paste-and-go starter",
    kind: "Template",
    copy: "The starter page every Library template begins from: one token block reskins everything on it. Open it, change an accent value, watch the page follow.",
    href: "/goodwork/index.html",
    cta: "Open the starter",
  },
  {
    id: "console",
    name: "Content Console screens",
    kind: "System walkthrough",
    copy: "Screenshots from consoles built and run for real clients, with what each screen does and why it earns its place.",
    to: "/systems/content-console",
    cta: "See the console",
  },
];
