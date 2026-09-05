// GOOD WORK's real package ladder — presented live, not published on the
// public site. thesolarconsultant.uk/goodwork.agency's own Services page
// stays a build-your-own scope with no prices (a deliberate call: a
// prospect picks what they need and gets a number in conversation, rather
// than anchoring on a published tier that may not fit them). This data
// currently backs only the pitch deck (src/pages/Pitch.jsx).
//
// The journey the four core packages walk a client through:
//   look good → work properly → automate it → hand you the control room
//   — then, if they want it, GOOD GROWTH runs the whole thing for them.

export const PACKAGES = [
  {
    id: "site",
    name: "GOOD SITE",
    setup: "£888",
    monthly: "£28/mo",
    purpose: "Look good",
    pitch: "We make your business look as good online as it does in real life.",
  },
  {
    id: "business",
    name: "GOOD BUSINESS",
    setup: "£1,288",
    monthly: "£28/mo",
    purpose: "Perform properly",
    pitch: "Good Site makes you look better. Good Business makes the website work harder.",
  },
  {
    id: "machine",
    name: "GOOD MACHINE",
    setup: "£1,888",
    monthly: "£188/mo",
    purpose: "AI & automation",
    pitch: "We build technology into the business that can work even when you aren't.",
  },
  {
    id: "system",
    name: "GOOD SYSTEM",
    setup: "£2,800",
    monthly: "£188/mo",
    purpose: "Full system + Content Console",
    pitch: "We've built your website and your technology. Now we're giving you the control room.",
  },
];

// Not steps on the ladder — one's optional infrastructure, the other is an
// entirely different kind of engagement (we run it, rather than build it).
export const ADDONS = [
  {
    id: "crm",
    name: "GOOD CRM",
    setup: null,
    monthly: "+£100/mo",
    purpose: "CRM, if required",
    pitch: "Already got a CRM? We'll use yours. Don't have one? We'll provide it for £100 a month.",
  },
  {
    id: "growth",
    name: "GOOD GROWTH",
    setup: null,
    monthly: "£1,000/mo",
    purpose: "We run it for you",
    pitch: "We've built the machine. You can run it yourself — or for £1,000 a month, Good Work runs it for you.",
    note: "Management fee only — advertising spend is separate.",
  },
];
