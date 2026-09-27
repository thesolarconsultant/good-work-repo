// The Library — everything browsable at /library.
//
// Three sources, one shape:
//   1. libraryCatalogue.json — generated from the real component source by
//      scripts/build-library-catalogue.mjs. 166 live, previewable items.
//   2. TEMPLATES — complete quick-launch websites. The starter is real and
//      opens today; the planned templates are labelled exactly that.
//   3. SYSTEMS_ITEMS — the Studio systems, listed so the tier filter tells
//      the truth about what Studio adds. They preview as descriptions, not
//      downloads, because their source is delivered after purchase.
//
// Shape: { id, slug, name, description, kind, category, tier, status, stack,
//          complexity, dependencies, version, updated, preview?, href?, to? }
//   kind:   section | component | template | system
//   tier:   library | studio
//   status: available | preview | coming-soon

import CATALOGUE from "./libraryCatalogue.json";

export const CATEGORIES = [
  { id: "websites", name: "Full websites" },
  { id: "landing", name: "Landing pages" },
  { id: "heroes", name: "Heroes" },
  { id: "pricing", name: "Pricing" },
  { id: "navigation", name: "Navigation" },
  { id: "forms", name: "Forms" },
  { id: "features", name: "Feature sections" },
  { id: "social-proof", name: "Social proof" },
  { id: "faq", name: "FAQ" },
  { id: "conversion", name: "Conversion" },
  { id: "dashboards", name: "Dashboards" },
  { id: "content-systems", name: "Content systems" },
  { id: "agents", name: "Bots and agents" },
  { id: "crm", name: "CRM interfaces" },
  { id: "buttons", name: "Buttons" },
  { id: "text", name: "Text effects" },
  { id: "motion", name: "Motion" },
  { id: "backgrounds", name: "Backgrounds" },
  { id: "interface", name: "Interface pieces" },
];
export const CATEGORY_NAME = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.name]));

export const TIERS = [
  { id: "library", name: "Library", price: "£280 one-time" },
  { id: "studio", name: "Studio", price: "£888 one-time" },
];

export const KINDS = [
  { id: "template", name: "Templates" },
  { id: "section", name: "Sections" },
  { id: "component", name: "Components" },
  { id: "system", name: "Systems" },
];

export const STATUS_LABEL = {
  available: "Live preview",
  preview: "Preview item",
  "coming-soon": "Coming soon",
};

export const TEMPLATES = [
  {
    id: "starter",
    slug: "paste-and-go-starter",
    name: "Paste-and-go starter",
    description: "The page every template begins from: brand tokens at the top, a slot to paste Library components into, no build step.",
    kind: "template",
    category: "websites",
    tier: "library",
    status: "available",
    stack: ["HTML", "CSS"],
    complexity: "drop-in",
    dependencies: ["Optional: goodwork-motion.css and .js"],
    version: "1.0.0",
    updated: "2026-09-26",
    href: "/goodwork/index.html",
    featured: true,
    detail: [
      "A single HTML file with the seven-block brand token contract at the top and a dashed slot to paste into.",
      "Light and dark themes are both defined; flip data-theme on the html element to choose which leads.",
      "Delete the guide header and the drop zone once the page is filled, and deploy it anywhere static files are served.",
    ],
  },
  {
    id: "tpl-trade",
    slug: "trade-and-field-service-site",
    name: "Trade and field-service website",
    description: "A complete site for installers and contractors: services, guarantee, proof, enquiry route and a WhatsApp-first contact path.",
    kind: "template",
    category: "websites",
    tier: "library",
    status: "coming-soon",
    stack: ["HTML", "CSS", "JavaScript"],
    complexity: "easy",
    dependencies: [],
    version: "planned",
    updated: "2026-09-26",
    detail: ["Planned for the Library release. Built from the same section library shown here; the structure follows the live trade sites in the showcase."],
  },
  {
    id: "tpl-professional",
    slug: "professional-services-site",
    name: "Professional-services website",
    description: "Advice-led businesses: positioning, services, process, team, articles and a booking-first contact page.",
    kind: "template",
    category: "websites",
    tier: "library",
    status: "coming-soon",
    stack: ["HTML", "CSS", "JavaScript"],
    complexity: "easy",
    dependencies: [],
    version: "planned",
    updated: "2026-09-26",
    detail: ["Planned for the Library release."],
  },
  {
    id: "tpl-landing",
    slug: "single-offer-landing-page",
    name: "Single-offer landing page",
    description: "One offer, one action: hero, proof, what's included, pricing, FAQ and a conversion section, assembled from Library sections.",
    kind: "template",
    category: "landing",
    tier: "library",
    status: "coming-soon",
    stack: ["HTML", "CSS"],
    complexity: "drop-in",
    dependencies: [],
    version: "planned",
    updated: "2026-09-26",
    detail: ["Planned for the Library release."],
  },
];

export const SYSTEM_ITEMS = [
  {
    id: "sys-console",
    slug: "content-console",
    name: "Content Console",
    description: "Plan, draft and publish blogs, social, email and WhatsApp templates from one board, with the SEO fields beside the writing.",
    kind: "system",
    category: "content-systems",
    tier: "studio",
    status: "preview",
    stack: ["React", "Edge functions", "Any model provider"],
    complexity: "moderate",
    dependencies: ["A model provider key", "Hosting or a managed plan"],
    version: "1.0.0",
    updated: "2026-09-26",
    to: "/systems/content-console",
    image: "/console/tsc-console-pipeline.jpg",
    featured: true,
  },
  {
    id: "sys-whatsapp",
    slug: "whatsapp-bot",
    name: "WhatsApp bot system",
    description: "Structured enquiry, qualification and support journeys for the WhatsApp Business platform, with hand-off and booking branches.",
    kind: "system",
    category: "agents",
    tier: "studio",
    status: "preview",
    stack: ["Flow definitions", "WhatsApp Business API", "Webhooks"],
    complexity: "moderate",
    dependencies: ["WhatsApp Business account", "Messaging provider"],
    version: "1.0.0",
    updated: "2026-09-26",
    to: "/systems/whatsapp-bot",
  },
  {
    id: "sys-voice",
    slug: "voice-agent",
    name: "AI voice-agent system",
    description: "A first point of contact that answers, qualifies and books, as a defined journey with clear hand-off rules.",
    kind: "system",
    category: "agents",
    tier: "studio",
    status: "preview",
    stack: ["Journey definitions", "Telephony provider", "Voice and model provider"],
    complexity: "moderate",
    dependencies: ["Telephone number", "Voice and model provider"],
    version: "1.0.0",
    updated: "2026-09-26",
    to: "/systems/voice-agent",
  },
  {
    id: "sys-brand",
    slug: "brand-guide-system",
    name: "Brand guide system",
    description: "Discovery framework, AI-assisted prompts and a generator that outputs a guideline document and a working token file.",
    kind: "system",
    category: "content-systems",
    tier: "studio",
    status: "preview",
    stack: ["Markdown", "CSS tokens", "Node scripts"],
    complexity: "easy",
    dependencies: [],
    version: "1.0.0",
    updated: "2026-09-26",
    to: "/systems/brand-guide",
  },
  {
    id: "sys-automations",
    slug: "automation-blueprints",
    name: "Automation blueprints",
    description: "Form-to-CRM, enquiry-to-follow-up, booking-to-reminder and review-request workflows with the payload shapes Goodwork forms send.",
    kind: "system",
    category: "crm",
    tier: "studio",
    status: "preview",
    stack: ["Diagrams", "Webhook payloads", "Any automation tool"],
    complexity: "easy",
    dependencies: [],
    version: "1.0.0",
    updated: "2026-09-26",
    to: "/systems/automations",
  },
  {
    id: "sys-crm-ui",
    slug: "crm-pipeline-interface",
    name: "CRM pipeline interface",
    description: "The lead record, pipeline board and follow-up views used in the Embedded CRM implementation.",
    kind: "system",
    category: "crm",
    tier: "studio",
    status: "coming-soon",
    stack: ["HTML", "CSS", "JavaScript"],
    complexity: "moderate",
    dependencies: [],
    version: "planned",
    updated: "2026-09-26",
    to: "/crm",
  },
];

// Hand-picked featured components: the strongest previews from each family.
const FEATURED_IDS = new Set(["herobadge", "pricingtiers", "faqsection", "bento", "navbar", "ctabox", "statscount", "testimonialwall", "magiccard", "borderbeam"]);

export const ITEMS = [
  ...TEMPLATES,
  ...CATALOGUE.map((c) => ({ ...c, featured: FEATURED_IDS.has(c.id) })),
  ...SYSTEM_ITEMS,
];

export const ITEM_BY_SLUG = Object.fromEntries(ITEMS.map((i) => [i.slug, i]));

export const FEATURED = ITEMS.filter((i) => i.featured);
export const RECENT = [...ITEMS].filter((i) => i.status === "available").sort((a, b) => (a.updated < b.updated ? 1 : -1)).slice(0, 8);

export const STACKS = [...new Set(ITEMS.flatMap((i) => i.stack))];

/** The counts shown on the filter chips. */
export function countBy(items, key) {
  const out = {};
  for (const i of items) {
    const v = i[key];
    out[v] = (out[v] || 0) + 1;
  }
  return out;
}

/** Apply the URL-driven filters. `q` is free text over name + description. */
export function filterItems(items, { q = "", category = "", tier = "", kind = "", stack = "" }) {
  const needle = q.trim().toLowerCase();
  return items.filter((i) => {
    if (category && i.category !== category) return false;
    if (tier && i.tier !== tier) return false;
    if (kind && (kind === "component" ? !(i.kind === "component" || i.kind === "section") : i.kind !== kind)) return false;
    if (stack && !i.stack.includes(stack)) return false;
    if (needle && !`${i.name} ${i.description} ${i.category} ${i.sub || ""}`.toLowerCase().includes(needle)) return false;
    return true;
  });
}

/** Related items: same category first, then same kind. */
export function related(item, n = 4) {
  const same = ITEMS.filter((i) => i.slug !== item.slug && i.category === item.category);
  const kin = ITEMS.filter((i) => i.slug !== item.slug && i.category !== item.category && i.kind === item.kind);
  return [...same, ...kin].slice(0, n);
}
