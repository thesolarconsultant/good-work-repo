// Learn — founder-led guides, build notes and product releases.
//
// Content model (per entry): slug, title, summary, author, date, category,
// format (article | video), thumbnail, videoUrl, body (array of blocks),
// relatedProduct, seo { title, description }.
//
// Only genuine content goes in here. These starter entries are written from
// things that exist in this repository: the engine's build guide, the console
// that is running for clients, and the licence and pricing model itself.

export const LEARN_CATEGORIES = [
  { slug: "website-builds", name: "Website builds" },
  { slug: "components", name: "Component demonstrations" },
  { slug: "ai-agents", name: "AI agents" },
  { slug: "content-systems", name: "Content systems" },
  { slug: "brand-systems", name: "Brand systems" },
  { slug: "crm-sales", name: "CRM and sales operations" },
  { slug: "agency-building", name: "Agency building" },
  { slug: "releases", name: "Product releases" },
];

export const LEARN = [
  {
    slug: "build-a-site-from-the-engine",
    title: "Build a site from a brand in five steps",
    summary:
      "How every Goodwork template reads from one token file, and the five-step recipe that turns a brand into a finished page without touching block CSS.",
    author: "Jordan",
    date: "2026-09-26",
    category: "website-builds",
    format: "article",
    readTime: "5 min",
    relatedProduct: { label: "Goodwork Library", to: "/library" },
    body: [
      { type: "p", text: "The whole idea in one line: every colour, font and corner on the site reads from a token. brand.css sets the tokens. Change brand.css, change the site. Nothing else moves." },
      { type: "h2", text: "The five-minute recipe" },
      { type: "ol", items: [
        "Copy the engine: brand.css, the block CSS and the blocks you want from the Library.",
        "Fill the knob. Set the seven things a brand owns: accent, neutrals, fonts, radius, dark band, hero scrim, shadows.",
        "Drop the logo and fonts in, and point the font tokens at them.",
        "Pour in the words. Every block is a skeleton: replace the copy, keep the structure.",
        "Pick the lead theme. Light and dark both exist; you are only choosing which loads first.",
      ] },
      { type: "h2", text: "What is the engine and what is the brand" },
      { type: "p", text: "The engine never changes: block structure, block CSS, motion, layout rhythm and the two-theme machinery. The brand is the paste: accent colour and its cuts, the neutral palette, display and body fonts, corner radius, logo, copy and imagery." },
      { type: "p", text: "If you ever find yourself editing block CSS to change a colour, stop. That colour wants to be a token. That is the one rule that keeps the engine an engine." },
      { type: "cta", label: "Read the full build guide", to: "/docs/brand-tokens" },
    ],
  },
  {
    slug: "how-the-content-console-pipeline-works",
    title: "How the Content Console keeps a business publishing",
    summary:
      "The four-column pipeline, the review queue with a number on it, and why the SEO fields live on the same screen as the writing. Screens from consoles running for real clients.",
    author: "Jordan",
    date: "2026-09-26",
    category: "content-systems",
    format: "article",
    readTime: "6 min",
    relatedProduct: { label: "Content Console", to: "/systems/content-console" },
    body: [
      { type: "p", text: "Most small businesses go quiet online not because they don't see the point, but because writing a post is the last thing on the list after a full day on site. The Console removes the excuses one at a time." },
      { type: "h2", text: "One board for the whole operation" },
      { type: "p", text: "Topics move across four columns: backlog, drafting, review, published. Every card carries the search query it is written for, a priority and a flag saying whether it needs verified data before anyone can write it. One glance tells you the state of the operation." },
      { type: "h2", text: "A review queue with a number on it" },
      { type: "p", text: "The bottleneck in every content operation is the owner's attention. Making approval a visible queue with a count means work doesn't rot in a drafts folder for three weeks." },
      { type: "h2", text: "The SEO fields are in the form" },
      { type: "p", text: "Title, slug, category, read time, date and the excerpt that doubles as the meta description sit above the body. The fields that decide whether a post ranks are impossible to forget, because they are part of writing it." },
      { type: "h2", text: "No rented database" },
      { type: "p", text: "The console reads and writes the project's own files, or commits published content back to the repository, which triggers the deploy. There is no subscription holding the content hostage." },
      { type: "cta", label: "See the Content Console", to: "/systems/content-console" },
    ],
  },
  {
    slug: "one-time-ownership-monthly-only-if-we-run-it",
    title: "Pay once to own it. Pay monthly only if we run it.",
    summary:
      "Why Goodwork separates the build fee from the running cost, what the fair-use allowance actually covers, and how to read the managed plans.",
    author: "Jordan",
    date: "2026-09-26",
    category: "releases",
    format: "article",
    readTime: "4 min",
    relatedProduct: { label: "Pricing", to: "/pricing" },
    body: [
      { type: "p", text: "Every Goodwork product and service is paid once. Library at £280, Studio at £888, Built by Goodwork at £2,800, the Embedded CRM at £1,888 and the Agency programme at £8,888.88. You own what you bought." },
      { type: "h2", text: "What continues to cost money" },
      { type: "p", text: "Hosting, domains, WhatsApp conversations, telephone numbers and minutes, AI-model usage, email and SMS are variable third-party costs. They are never inside a one-time fee. You can pay your providers directly and run compatible products on your own infrastructure." },
      { type: "h2", text: "When a managed plan makes sense" },
      { type: "p", text: "If you would rather Goodwork hosted, monitored and maintained the live system, the managed plans start at £28 per month for a website and go up to £398 per month for the complete system with both agents. Each plan includes a defined fair-use allowance for variable usage, confirmed before launch, and anything beyond it is billed separately rather than hidden." },
      { type: "cta", label: "Compare every option", to: "/pricing" },
    ],
  },
  {
    slug: "what-the-agency-programme-actually-covers",
    title: "A website does not make an agency. The operation behind it does.",
    summary:
      "What the £8,888.88 programme installs beyond the website: positioning, offers, sales process, delivery system, CRM, automations and a launch plan.",
    author: "Jordan",
    date: "2026-09-26",
    category: "agency-building",
    format: "article",
    readTime: "5 min",
    relatedProduct: { label: "Build Your Agency", to: "/agency" },
    body: [
      { type: "p", text: "Plenty of people can build an agency website. Far fewer have a positioning they can defend, packages a client can compare, a sales process that runs the same way twice and a delivery system that survives a busy month." },
      { type: "h2", text: "Positioning and offers first" },
      { type: "p", text: "The programme starts with who the agency is for and what it sells: ideal-customer definition, offer architecture, packages and pricing, and naming support where it is needed. The website comes after those decisions, not before." },
      { type: "h2", text: "Then the operation" },
      { type: "p", text: "Brand guidelines, a premium agency website, the Library and Studio systems the agency will deliver with, the Content Console, WhatsApp bot and voice agent, the Embedded CRM, a lead-capture and appointment workflow, proposal and onboarding processes, sales scripts, fulfilment SOPs, a hosting and support model, and a launch strategy." },
      { type: "h2", text: "The licence" },
      { type: "p", text: "The commercial licence lets the agency deliver finished client work with Goodwork systems. It does not let the agency resell or sublicense the raw source library as a competing template or code product." },
      { type: "cta", label: "Explore the Agency Programme", to: "/agency" },
    ],
  },
];

export const LEARN_BY_SLUG = Object.fromEntries(LEARN.map((e) => [e.slug, e]));
