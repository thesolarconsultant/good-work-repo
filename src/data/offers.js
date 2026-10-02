// =========================================================
// THE SINGLE SOURCE OF TRUTH FOR EVERYTHING GOODWORK SELLS.
//
// Every price, inclusion, exclusion, CTA and plan on the site is read from
// this file. Nothing else may carry a figure. Change a number here and the
// homepage, the offer pages, the pricing table, the pitch deck, the FAQ, the
// structured data and the checkout endpoint's product map all follow.
//
// Two rules the copy is written to:
//   1. "one-time" and "per month" are always said out loud (see lib/format.js).
//   2. Third-party consumption — messaging, telephony, model usage, hosting —
//      is never implied to be included. Exclusions sit next to the offer.
//
// VAT: none. Goodwork doesn't charge VAT or any other tax, so every figure here
// is the whole price, and checkout adds nothing on top.
// =========================================================

import { gbp, gbpRange, priceLabel } from "../lib/format.js";

export const UPDATE_PERIOD_MONTHS = 12;

// The CRM is priced as a range: the standard build, and the most that premium
// connectors and integrations take it to, confirmed in the written scope.
const CRM_FROM = 1700;
const CRM_TO = 5300;

// ---------------------------------------------------------------------------
// The five commercial offers
// ---------------------------------------------------------------------------

export const OFFERS = [
  {
    id: "library",
    name: "Goodwork Library",
    short: "Library",
    kind: "product", // product | service
    billing: "one-time",
    price: 280,
    route: "/library",
    purchase: "checkout", // checkout | enquiry
    who: "You build it",
    outcome: "Build professional websites faster.",
    ladder: "Build professional websites faster.",
    summary:
      "The entry product. Access to Goodwork's reusable website code and a curated collection of quick-launch website templates.",
    line: "One payment. Production-ready code. Build as many finished websites as your licence allows—and keep what you download.",
    includes: [
      "Complete access to the core component library",
      "Reusable heroes, navigation, feature sections, pricing sections, FAQs, forms, footers and conversion sections",
      "A curated set of complete quick-launch website templates",
      "Responsive source code",
      "Live previews",
      "Installation and customisation guidance",
      "Commercial use for completed websites created for you or your clients",
      "Permanent rights to continue using code already downloaded under the licence",
      `${UPDATE_PERIOD_MONTHS} months of included product updates and new core-library releases`,
    ],
    excludes: [
      "Goodwork installing or customising anything",
      "Hosting, domains or deployment",
      "AI agents, the Content Console or advanced business systems",
      "Permission to redistribute, share, sublicense or resell Goodwork's raw source files as templates, libraries or competing products",
      "Unlimited personal development support",
    ],
    primaryCta: { label: `Get Library Access — ${gbp(280)}`, to: "/library#access" },
    secondaryCta: { label: "Explore the Library", to: "/library" },
    ladderCta: { label: "Get Library Access", to: "/library#access" },
  },
  {
    id: "studio",
    name: "Goodwork Studio",
    short: "Studio",
    kind: "product",
    billing: "one-time",
    price: 888,
    route: "/studio",
    purchase: "checkout",
    who: "You build it",
    badge: "Most complete self-build option",
    outcome: "Build the website, brand and intelligent systems yourself.",
    ladder: "Build websites, brands and intelligent systems.",
    summary:
      "The main self-build product. Everything in Goodwork Library plus the systems, templates and documentation required to assemble a more complete modern business platform.",
    line: "The complete Goodwork toolkit for building websites, brands, content systems and customer-facing automation.",
    distinction:
      "Studio is self-build. Goodwork provides the source, systems and instructions; you configure and deploy them.",
    includes: [
      "Everything in Goodwork Library",
      "WhatsApp bot system and implementation guidance",
      "AI voice-agent system and implementation guidance",
      "Goodwork Content Console",
      "Brand-guideline creation system",
      "Brand discovery framework and AI-assisted brand prompts",
      "Automation templates and workflow blueprints",
      "Lead-capture and qualification flows",
      "Setup guides, system diagrams and implementation checklists",
      `${UPDATE_PERIOD_MONTHS} months of included Studio updates`,
    ],
    excludes: [
      "Goodwork implementation or customisation",
      "Hosting or servers",
      "WhatsApp conversation charges",
      "Telephone numbers or call minutes",
      "AI-model and API usage",
      "Third-party subscriptions",
      "Bespoke engineering or unlimited support",
    ],
    primaryCta: { label: `Get Goodwork Studio — ${gbp(888)}`, to: "/studio#access" },
    secondaryCta: { label: "See Everything Included", to: "/studio#included" },
    ladderCta: { label: "Get Goodwork Studio", to: "/studio#access" },
  },
  {
    id: "built",
    name: "Built by Goodwork",
    short: "Built by Goodwork",
    kind: "service",
    billing: "one-time",
    price: 3500,
    route: "/built-by-goodwork",
    purchase: "enquiry",
    form: "built",
    who: "We build it with you",
    outcome: "Goodwork installs, customises and launches the complete system for one business.",
    ladder: "We customise and launch the system for your business.",
    summary:
      "A defined implementation service based on the Goodwork Studio system. It is not unlimited bespoke software development.",
    line: "Give us the business. We will turn the Goodwork system into a complete, branded and launch-ready digital operation.",
    includes: [
      "Everything in the Goodwork Studio toolkit, as required for the agreed build",
      "One template-led, professionally customised website for one business",
      "Application of your approved brand, copy and imagery",
      "Agreed page set and navigation",
      "Core lead-capture forms",
      "Configuration of one agreed WhatsApp bot flow",
      "Configuration of one agreed AI voice-agent flow",
      "Installation and configuration of the Content Console",
      "Creation of a practical brand-guideline document",
      "Core integrations agreed before work begins",
      "Responsive testing, launch and handover",
      "A fixed revision allowance stated in the proposal",
    ],
    scope: [
      "One business and one website",
      "Agreed page limit",
      "Agreed integrations",
      "Agreed bot and voice-agent journeys",
      "Fixed revision rounds",
      "You supply or approve the required business information promptly",
      "Bespoke applications, unusually complex integrations, ecommerce catalogues, large content migrations and additional agent flows are quoted separately",
    ],
    excludes: [
      "Third-party and operational charges (hosting, messaging, telephony, AI-model usage, subscriptions)",
      "Unlimited bespoke software development",
      "Additional websites, businesses or agent flows beyond the agreed scope",
      "Ongoing maintenance, unless a managed plan is selected",
    ],
    primaryCta: { label: "Start Your Build", to: "/built-by-goodwork#enquire" },
    secondaryCta: { label: "View the Scope", to: "/built-by-goodwork#scope" },
    ladderCta: { label: "Start Your Build", to: "/built-by-goodwork#enquire" },
  },
  {
    id: "crm",
    name: "Goodwork Embedded CRM",
    short: "Embedded CRM",
    kind: "service",
    addon: true,
    billing: "one-time",
    price: CRM_FROM,
    priceTo: CRM_TO,
    priceNote: `${gbp(CRM_FROM)} for the standard build, with an interface and functionality shaped to the business. Premium connectors and integrations take it up to ${gbp(CRM_TO)}, confirmed in the written scope.`,
    route: "/crm",
    purchase: "enquiry",
    form: "crm",
    who: "We build it with you",
    outcome: "Place your sales and customer-management system inside your wider Goodwork setup.",
    ladder: "A branded CRM inside your Goodwork system.",
    summary:
      "Available as a standalone implementation or as an add-on to Built by Goodwork. The price depends on the connectors it needs. The server is expressly excluded.",
    line: "Keep every lead, answer and next action in one place.",
    includes: [
      "Branded CRM access and login experience",
      "An interface and functionality shaped to the business",
      "Customer and lead records",
      "Custom sales pipeline",
      "Website-form integration",
      "Tasks, notes and follow-up management",
      "Storage of discovery and onboarding responses",
      "Proposal or project-status tracking where supported",
      "Basic workflow automations",
      "Agreed user roles and permissions",
      "Dashboard configuration",
      "Initial training and handover",
    ],
    excludes: [
      "Server, hosting or infrastructure",
      "Email, SMS, telephone or WhatsApp consumption",
      "Third-party API charges",
      "Large or badly structured data migrations",
      "Bespoke CRM product development",
      "Ongoing maintenance, unless a managed plan is selected",
    ],
    primaryCta: { label: "Discuss Your CRM", to: "/crm#enquire" },
    secondaryCta: { label: "See CRM Features", to: "/crm#features" },
    ladderCta: { label: "Discuss Your CRM", to: "/crm#enquire" },
  },
  {
    id: "agency",
    name: "We Help Build Your Agency",
    short: "Build Your Agency",
    kind: "service",
    billing: "one-time",
    price: 8888.88,
    instalments: { count: 4, amount: 2222.22, note: "subject to agreement and contract" },
    route: "/agency",
    purchase: "enquiry",
    form: "agency",
    who: "We build the operation",
    outcome:
      "Goodwork helps establish the positioning, sales system, delivery infrastructure and digital platform behind a modern agency.",
    ladder: "We help build the commercial operation behind the agency.",
    summary:
      "The flagship strategic and implementation engagement. It is materially different from simply purchasing a website.",
    line: "We do not just build your agency website. We help build the agency behind it.",
    includes: [
      "Agency positioning and ideal-customer definition",
      "Offer architecture, packages and pricing",
      "Name evaluation or naming support where required",
      "Brand identity direction and complete brand guidelines",
      "Premium agency website",
      "Goodwork Library and Studio systems needed for the agency",
      "Commercial white-label implementation rights for finished client work",
      "Content Console",
      "WhatsApp bot and voice-agent configuration",
      "Embedded CRM implementation",
      "Lead-capture and appointment workflow",
      "Sales pipeline and core automations",
      "Proposal, quotation, discovery and onboarding process",
      "Client questionnaires and interview scripts",
      "Sales scripts and objection-handling resources",
      "Fulfilment workflows and standard operating procedures",
      "Hosting and client-support model",
      "Content and launch strategy",
      "Defined strategy and implementation sessions",
      "Launch support",
    ],
    licenceNote:
      "The commercial licence allows the agency to use Goodwork systems to deliver completed work for its clients. It does not permit the agency to redistribute, sell or sublicense Goodwork's raw source library as a competing template or code product.",
    excludes: [
      "Hosting, telephony, messaging and AI-model consumption for the agency or its clients",
      "Redistribution, sale or sublicensing of Goodwork's raw source library",
      "Client work delivered by Goodwork on the agency's behalf, unless quoted separately",
    ],
    primaryCta: { label: "Apply to Build Your Agency", to: "/agency#apply" },
    secondaryCta: { label: "Explore the Agency Programme", to: "/agency" },
    ladderCta: { label: "Apply Now", to: "/agency#apply" },
  },
];

export const OFFER = Object.fromEntries(OFFERS.map((o) => [o.id, o]));

/** The four primary ladder cards. The CRM sits beneath them as an add-on. */
export const LADDER = ["library", "studio", "built", "agency"].map((id) => OFFER[id]);

export const VALUE_LADDER_SENTENCE = `${gbp(OFFER.library.price)} to build websites. ${gbp(OFFER.studio.price)} to build intelligent systems. ${gbp(OFFER.built.price)} to have Goodwork build it for you. ${gbp(OFFER.agency.price)} to build the agency behind it.`;

/** Built by Goodwork + Embedded CRM, the combination worth showing. */
export const COMBINED = {
  items: [OFFER.built, OFFER.crm],
  total: OFFER.built.price + OFFER.crm.price,
  totalTo: OFFER.built.price + (OFFER.crm.priceTo || OFFER.crm.price),
  label: "Complete implementation",
  note: "plus infrastructure",
};

// ---------------------------------------------------------------------------
// Managed infrastructure — monthly, optional, separate from ownership
// ---------------------------------------------------------------------------

export const OWNERSHIP_PRINCIPLE =
  "Pay once to own the system. Pay monthly only if you want Goodwork to run it for you.";

export const MANAGED_PLANS = [
  {
    id: "care",
    name: "Website Care",
    price: 58,
    billing: "monthly",
    for: "Your website, kept online and looked after.",
    includes: [
      "Managed website hosting",
      "SSL and security monitoring",
      "Routine backups",
      "Uptime monitoring",
      "Core dependency maintenance",
    ],
  },
  {
    id: "console",
    name: "Website + Content Console",
    price: 188,
    billing: "monthly",
    for: "Your website and Content Console, connected and run for you.",
    includes: [
      "Everything in Website Care",
      "Hosted Content Console, connected to your website",
      "Console maintenance and updates",
      "Account access and routine backups",
    ],
  },
  {
    id: "complete",
    name: "Complete Managed System",
    price: 398,
    billing: "monthly",
    for: "Website, Content Console and both agents, with monthly credit.",
    includes: [
      "Everything in Website + Content Console",
      "Managed WhatsApp chatbot, with chatbot credit",
      "Managed AI voice agent, with voice-agent credit",
      "API credit for the connected services",
      "Content Console imagery made from your own photos",
      "Integration monitoring",
      "Priority routine technical support",
    ],
  },
  {
    id: "complete-ai",
    name: "Complete + AI Content",
    price: 598,
    billing: "monthly",
    featured: true,
    tag: "Everything",
    for: "Everything in Complete, plus AI imagery and B-roll video.",
    includes: [
      "Everything in Complete Managed System",
      "The full Content Console, with AI-generated imagery",
      "AI B-roll video for your posts and campaigns",
    ],
  },
];

/** "From £58 per month": the cheapest plan, wherever a starting figure is quoted. */
export const MANAGED_FROM = `From ${gbp(MANAGED_PLANS[0].price)} per month`;

/** Running the Embedded CRM, added to whichever plan the client is on. */
export const CRM_RUNNING = {
  id: "crm-running",
  name: "CRM running",
  price: 28,
  billing: "monthly",
};

/** Ads and business development. Scoped to each client, so no fixed price. */
export const COACHING = {
  id: "coaching",
  name: "Coaching programme",
  for: "Goodwork runs your ads and works with you, one to one, on business development.",
  priceNote: "Priced to your scope",
  scope: "Priced once we understand the business and everything it needs.",
};

export const FAIR_USE =
  "The Complete plans include a monthly credit for chatbot conversations, voice-agent calls and API usage, agreed before launch. Usage beyond the credit, email, SMS and extra telephone numbers are billed separately. High-volume usage, additional agents, complex integrations and bespoke maintenance are quoted separately.";

export const SELF_HOST_NOTE =
  "You can run compatible Goodwork products on your own infrastructure and pay your providers directly. A managed plan is only for when you want Goodwork to host, monitor and maintain the live system.";

// ---------------------------------------------------------------------------
// Pricing-page comparison — grouped rows, four columns
// ---------------------------------------------------------------------------
// Values: true (included), false (not included), or a short string.

export const COMPARISON_COLUMNS = ["library", "studio", "built", "agency"];

export const COMPARISON = [
  {
    group: "Code and templates",
    rows: [
      { label: "Core component library", library: true, studio: true, built: "Used in your build", agency: true },
      { label: "Quick-launch website templates", library: true, studio: true, built: "Used in your build", agency: true },
      { label: "Responsive source code and live previews", library: true, studio: true, built: "Handed over at launch", agency: true },
      { label: "Installation and customisation guidance", library: true, studio: true, built: "Done for you", agency: true },
    ],
  },
  {
    group: "Intelligent systems",
    rows: [
      { label: "WhatsApp bot system", library: false, studio: "Source and guidance", built: "One flow configured", agency: "Configured" },
      { label: "AI voice-agent system", library: false, studio: "Source and guidance", built: "One flow configured", agency: "Configured" },
      { label: "Content Console", library: false, studio: "Source and guidance", built: "Installed and configured", agency: "Installed and configured" },
      { label: "Automation templates and workflow blueprints", library: false, studio: true, built: "Core automations set up", agency: "Sales pipeline and core automations" },
      { label: "Lead-capture and qualification flows", library: false, studio: true, built: "Core forms configured", agency: "Lead-capture and appointment workflow" },
    ],
  },
  {
    group: "Brand and content",
    rows: [
      { label: "Brand-guideline creation system", library: false, studio: true, built: "Practical brand-guideline document created", agency: "Complete brand guidelines" },
      { label: "Brand discovery framework and AI-assisted prompts", library: false, studio: true, built: "Applied to your brand", agency: "Positioning and identity direction" },
      { label: "Content and launch strategy", library: false, studio: false, built: false, agency: true },
    ],
  },
  {
    group: "Implementation",
    rows: [
      { label: "Who does the implementation", library: "You", studio: "You", built: "Goodwork, with you", agency: "Goodwork, with you" },
      { label: "Website customised and launched by Goodwork", library: false, studio: false, built: "One website, one business", agency: "Premium agency website" },
      { label: "Strategy and implementation sessions", library: false, studio: false, built: "Scoping and handover", agency: "Defined sessions" },
      { label: "Offer architecture, packages and pricing", library: false, studio: false, built: false, agency: true },
      { label: "Sales scripts, proposals, onboarding and SOPs", library: false, studio: false, built: false, agency: true },
    ],
  },
  {
    group: "CRM",
    rows: [
      { label: "Embedded CRM implementation", library: false, studio: false, built: `Add-on, ${gbpRange(OFFER.crm.price, OFFER.crm.priceTo)} one-time`, agency: true },
      { label: "CRM server and infrastructure", library: false, studio: false, built: "Not included", agency: "Not included" },
    ],
  },
  {
    group: "Commercial usage",
    rows: [
      { label: "Finished websites for you or your clients", library: true, studio: true, built: "Your business", agency: true },
      { label: "White-label implementation rights for client work", library: "Finished sites only", studio: "Finished sites and systems", built: "Not applicable", agency: true },
      { label: "Redistribute or resell the raw source", library: false, studio: false, built: false, agency: false },
    ],
  },
  {
    group: "Support and updates",
    rows: [
      { label: "Included updates", library: `${UPDATE_PERIOD_MONTHS} months`, studio: `${UPDATE_PERIOD_MONTHS} months`, built: "Through launch and handover", agency: "Through launch" },
      { label: "Documentation and setup guides", library: true, studio: true, built: true, agency: true },
      { label: "Fixed revision allowance", library: false, studio: false, built: "Stated in the proposal", agency: "Stated in the agreement" },
      { label: "Launch support", library: false, studio: false, built: true, agency: true },
    ],
  },
  {
    group: "Infrastructure",
    rows: [
      { label: "Hosting, domains and servers", library: "Your own", studio: "Your own", built: "Your own or a managed plan", agency: "Hosting model defined; costs separate" },
      { label: "Messaging, telephony and AI-model usage", library: "Not applicable", studio: "Paid to your providers", built: "Paid to your providers", agency: "Paid to your providers" },
      { label: "Optional managed plan", library: MANAGED_FROM, studio: MANAGED_FROM, built: MANAGED_FROM, agency: MANAGED_FROM },
    ],
  },
];

// ---------------------------------------------------------------------------
// Commercial licence principles — the readable summary. Final wording is for
// solicitor review and is flagged as such wherever it is shown.
// ---------------------------------------------------------------------------

export const LICENCE_PRINCIPLES = [
  "A valid customer can use eligible Goodwork code to build completed websites or systems within the scope of the purchased licence.",
  "Commercial client implementation is allowed where the relevant product says so.",
  "You may modify code for permitted finished projects.",
  "You cannot redistribute, publish, share, sublicense or sell the raw Goodwork source.",
  "You cannot use Goodwork assets to create a competing template library, UI kit, source-code marketplace or downloadable product.",
  "Transferring a finished client project does not transfer the right to extract and redistribute the Goodwork library.",
  "Third-party packages remain governed by their own licences.",
  "Goodwork does not transfer ownership of its underlying reusable intellectual property.",
  "Access may be suspended for fraud, credential sharing, redistribution or material licence breach.",
  "Refund wording for downloadable products must comply with applicable consumer law and is subject to legal review.",
];

// ---------------------------------------------------------------------------
// FAQ — answers must agree with everything above.
// ---------------------------------------------------------------------------

export const FAQ = [
  {
    q: "Is each product a one-time payment?",
    a: `Yes. Library (${priceLabel(OFFER.library.price, "one-time")}), Studio (${priceLabel(OFFER.studio.price, "one-time")}), Built by Goodwork (${priceLabel(OFFER.built.price, "one-time")}), the Embedded CRM (${gbpRange(OFFER.crm.price, OFFER.crm.priceTo)} one-time, depending on its connectors) and the Agency programme (${priceLabel(OFFER.agency.price, "one-time")}, or four agreed payments of ${gbp(OFFER.agency.instalments.amount)}) are all paid once. The only monthly charges are the optional managed plans, and you choose whether to take one.`,
  },
  {
    q: "What is the difference between Library and Studio?",
    a: "Library is the website code: the component library, quick-launch templates, previews and guidance. Studio includes everything in Library and adds the intelligent systems: the WhatsApp bot system, the AI voice-agent system, the Content Console, the brand-guideline system, automation blueprints, lead-capture flows and the setup documentation to assemble them. Both are self-build.",
  },
  {
    q: "Can I use the code for client websites?",
    a: "Yes. Library and Studio both allow commercial use for completed websites you build for your own business or for your clients. You keep permanent rights to use code you have already downloaded under the licence.",
  },
  {
    q: "Can I resell the raw templates or source code?",
    a: "No. You cannot redistribute, share, sublicense or sell Goodwork's raw source files as templates, libraries, UI kits or competing products. Handing a finished client project over does not transfer the right to extract and redistribute the library.",
  },
  {
    q: "Does the £888 Studio package include installation?",
    a: `No. Studio is self-build: Goodwork provides the source, systems and instructions, and you configure and deploy them. If you want Goodwork to install, customise and launch the system for you, that is Built by Goodwork at ${gbp(OFFER.built.price)}.`,
  },
  {
    q: `What exactly does the ${gbp(OFFER.built.price)} service cover?`,
    a: "One template-led, professionally customised website for one business, with your approved brand, copy and imagery applied; an agreed page set and navigation; core lead-capture forms; one agreed WhatsApp bot flow; one agreed AI voice-agent flow; the Content Console installed and configured; a practical brand-guideline document; the core integrations agreed before work begins; responsive testing, launch and handover; and a fixed revision allowance stated in the proposal. Bespoke applications, unusually complex integrations, ecommerce catalogues, large content migrations and additional agent flows are quoted separately.",
  },
  {
    q: "Are hosting and server costs included?",
    a: `No. None of the one-time products or services include hosting, domains, servers or deployment infrastructure. You can run compatible Goodwork products on your own infrastructure and pay your providers directly, or choose a managed plan from ${gbp(MANAGED_PLANS[0].price)} per month if you want Goodwork to host and maintain the live system.`,
  },
  {
    q: "Are WhatsApp messages, telephone calls and AI usage included?",
    a: "No. WhatsApp conversation charges, telephone numbers, call minutes, AI-model and API usage, email and SMS are variable third-party costs and are never included in a one-time fee. The Complete managed plans include a monthly credit for chatbot, voice-agent and API usage, agreed before launch; anything beyond it is billed separately.",
  },
  {
    q: "What does the CRM implementation include, and what does it cost?",
    a: `${gbp(CRM_FROM)} one-time for the standard build: a branded CRM login experience, an interface and functionality shaped to the business, customer and lead records, a custom sales pipeline, website-form integration, tasks, notes and follow-up management, storage of discovery and onboarding responses, proposal or project-status tracking where supported, basic workflow automations, agreed user roles and permissions, dashboard configuration, and initial training and handover. Premium connectors and integrations take it up to ${gbp(CRM_TO)}, confirmed in the written scope before work starts. The server, hosting, communication consumption, third-party API charges, large data migrations and bespoke CRM development are not included; run on a managed plan, the CRM adds ${gbp(CRM_RUNNING.price)} per month.`,
  },
  {
    q: "Can I host everything myself?",
    a: "Yes. Every self-build product is designed to run on your own compatible infrastructure. The managed plans exist for people who would rather Goodwork hosted, monitored and maintained the live system, and they are entirely optional.",
  },
  {
    q: "What happens after the included update period?",
    a: `Library and Studio include ${UPDATE_PERIOD_MONTHS} months of product updates and new releases. After that you keep everything you have already downloaded and can carry on using it under the licence indefinitely. Renewal options for continued updates will be published before the first update period ends.`,
  },
  {
    q: "Is the Agency programme suitable for an existing agency?",
    a: "Yes, and it is also open to people starting one. For an existing agency the work focuses on sharpening positioning, offers and pricing, then installing the delivery system, CRM, automations and launch infrastructure behind them. The application asks whether the agency is new or existing so the sessions are planned accordingly.",
  },
  {
    q: "Do you offer refunds on downloadable source products?",
    a: "Because the Library and Studio deliver digital source files immediately, refund rights are limited once download or access has begun. The exact wording is being finalised to comply with UK consumer law and is under legal review. Read the draft refund policy before purchasing, and if you are unsure whether a product fits, ask us first.",
    review: true,
  },
  {
    q: "What support is included?",
    a: "Library and Studio include documentation, setup guides and installation guidance, and product updates for the included period. They do not include unlimited personal development support or bespoke engineering. Built by Goodwork includes launch support and handover. Managed plans include routine technical support at the level shown for each plan.",
  },
];

// ---------------------------------------------------------------------------
// Homepage / marketing copy that must repeat prices consistently
// ---------------------------------------------------------------------------

export const PROOF_LINE = ["One-time product access", "Commercial implementation rights", "Optional managed infrastructure"];

export const TWO_WAYS = [
  {
    id: "tools",
    title: "I want the tools",
    copy: "Get production-ready code, templates and intelligent systems. Configure them yourself and move at your own pace.",
    cta: { label: "View products", to: "/library" },
  },
  {
    id: "outcome",
    title: "I want the outcome",
    copy: "Give us the business requirements. We will customise, connect and launch the system for you.",
    cta: { label: "View services", to: "/services" },
  },
];

export const STUDIO_FEATURES = [
  { id: "whatsapp-bot", name: "WhatsApp Bot", copy: "Create structured enquiry, qualification and support journeys.", to: "/systems/whatsapp-bot" },
  { id: "voice-agent", name: "Voice Agent", copy: "Build a capable first point of contact that can answer, qualify and book.", to: "/systems/voice-agent" },
  { id: "content-console", name: "Content Console", copy: "Turn business knowledge into useful content without starting from an empty screen.", to: "/systems/content-console" },
  { id: "brand-guide", name: "Brand Guide System", copy: "Define positioning, voice, visual direction and consistent application.", to: "/systems/brand-guide" },
  { id: "automations", name: "Automation Blueprints", copy: "Connect forms, follow-ups, internal actions and customer communication.", to: "/systems/automations" },
];

export const JOURNEY = [
  { id: "website", step: "Website captures attention", detail: "A fast, well-built site with one clear route to enquire.", system: "Library" },
  { id: "whatsapp", step: "WhatsApp bot qualifies the enquiry", detail: "Structured questions, asked the way you would ask them, at any hour.", system: "Studio" },
  { id: "voice", step: "Voice agent handles or books conversations", detail: "Answers the routine calls, takes the details, books the slot.", system: "Studio" },
  { id: "console", step: "Content Console helps the business publish", detail: "Drafts in your voice from what you already know, ready to review.", system: "Studio" },
  { id: "crm", step: "CRM stores the lead and next action", detail: "Every lead, answer and follow-up in one pipeline you own.", system: "Embedded CRM" },
];
