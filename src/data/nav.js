// Navigation — one place, so the header, the drawer, the footer and the
// sitemap can never disagree about where things are.

export const PRODUCTS_MENU = {
  label: "Products",
  intro: "Reusable code, templates and intelligent business systems. Self-build, one-time.",
  items: [
    { to: "/library", label: "Goodwork Library", note: "Components and quick-launch templates" },
    { to: "/studio", label: "Goodwork Studio", note: "The complete self-build toolkit" },
    { to: "/library?type=template", label: "Website Templates", note: "Complete sites, ready to customise" },
    { to: "/library?type=component", label: "Components", note: "Sections, motion and interface pieces" },
    { to: "/systems/content-console", label: "Content Console", note: "Publish from what you already know" },
    { to: "/systems/whatsapp-bot", label: "WhatsApp Bot", note: "Qualify enquiries around the clock" },
    { to: "/systems/voice-agent", label: "Voice Agent", note: "Answer, qualify and book calls" },
  ],
};

export const SERVICES_MENU = {
  label: "Services",
  intro: "Implementation, customisation, infrastructure and agency building. Scoped first, then built.",
  items: [
    { to: "/built-by-goodwork", label: "Built by Goodwork", note: "We customise and launch the system" },
    { to: "/crm", label: "Embedded CRM", note: "Your pipeline inside your Goodwork setup" },
    { to: "/agency", label: "Build Your Agency", note: "The operation behind the agency" },
    { to: "/managed", label: "Managed Infrastructure", note: "Hosting, monitoring and maintenance" },
  ],
};

/** Top-level links, in order. `menu` marks the ones that open a dropdown. */
export const PRIMARY_NAV = [
  { to: "/library", label: "Library", menu: PRODUCTS_MENU },
  { to: "/systems", label: "Systems" },
  { to: "/services", label: "Services", menu: SERVICES_MENU },
  { to: "/pricing", label: "Pricing" },
  { to: "/showcase", label: "Showcase" },
  { to: "/learn", label: "Learn" },
];

export const NAV_CTA = { to: "/pricing", label: "Get access" };
export const NAV_SIGN_IN = { to: "/login", label: "Sign in" };

export const FOOTER_COLUMNS = [
  {
    heading: "Products",
    links: [
      { to: "/library", label: "Goodwork Library" },
      { to: "/studio", label: "Goodwork Studio" },
      { to: "/library?type=template", label: "Website Templates" },
      { to: "/library?type=component", label: "Components" },
      { to: "/systems/content-console", label: "Content Console" },
      { to: "/systems/whatsapp-bot", label: "WhatsApp Bot" },
      { to: "/systems/voice-agent", label: "Voice Agent" },
    ],
  },
  {
    heading: "Services",
    links: [
      { to: "/built-by-goodwork", label: "Built by Goodwork" },
      { to: "/crm", label: "Embedded CRM" },
      { to: "/agency", label: "Build Your Agency" },
      { to: "/managed", label: "Managed Infrastructure" },
      { to: "/pricing", label: "Pricing" },
    ],
  },
  {
    heading: "Company",
    links: [
      { to: "/showcase", label: "Showcase" },
      { to: "/learn", label: "Learn" },
      { to: "/docs/getting-started", label: "Documentation" },
      { to: "/contact", label: "Contact" },
      { to: "/login", label: "Sign in" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { to: "/legal/licence", label: "Commercial licence" },
      { to: "/legal/terms", label: "Terms" },
      { to: "/legal/refunds", label: "Refund policy" },
      { to: "/legal/privacy", label: "Privacy" },
      { to: "/legal/cookies", label: "Cookies" },
      { to: "/legal/acceptable-use", label: "Acceptable use" },
    ],
  },
];

export const ANNOUNCEMENT = {
  text: "Goodwork Library is opening with production-ready templates, components and complete digital systems.",
  short: "The Library is opening.",
  link: { to: "/library", label: "Explore the release" },
};
