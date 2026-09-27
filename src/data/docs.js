// Documentation — the structure a customer lands in after purchase. The
// content here is real (it describes the engine that exists in this
// repository); pages that depend on unreleased assets say so plainly.

export const DOCS = [
  {
    slug: "getting-started",
    title: "Getting started",
    summary: "What you receive, how the Library is organised, and the fastest route from download to a live page.",
    sections: [
      {
        h: "What you receive",
        p: [
          "Goodwork Library gives you the core component library, a curated set of quick-launch templates, responsive source code, live previews and the guidance on this site. Goodwork Studio adds the intelligent systems: WhatsApp bot, voice agent, Content Console, brand-guide system and automation blueprints, each with its own setup guide.",
          "Downloads come from your customer dashboard: sign in with the access key from your purchase email and the current bundle is one click away. Every file you download stays yours under the commercial licence.",
        ],
      },
      {
        h: "How the Library is organised",
        p: [
          "Every component is a drop-in vanilla HTML, CSS and JavaScript snippet. It works the same in React, Vue or a plain page, and reads its colour from the brand tokens with a fallback, so it renders on its own and reskins the moment you point it at your brand.",
          "Sections are named by role: Hero, Feature Section, Social Proof, Stats, Testimonials, Pricing, FAQ, CTA and Footer. Interface pieces, motion and backgrounds sit alongside them.",
        ],
      },
      {
        h: "The fastest route to a page",
        ol: [
          "Open the paste-and-go starter. It carries the token block and a slot to paste into.",
          "Copy a component from the Library and paste it into the slot.",
          "Change the accent and neutral values in the token block to match the brand.",
          "Optionally include the motion files so reveals, counters and effects auto-wire from data attributes.",
          "Delete the guide header and the dashed drop zone, and deploy the file anywhere static HTML is served.",
        ],
      },
    ],
    related: [{ label: "Brand tokens", to: "/docs/brand-tokens" }, { label: "Installing components", to: "/docs/installing-components" }],
  },
  {
    slug: "installing-components",
    title: "Installing components",
    summary: "Copying a snippet, keeping it self-contained, and wiring the optional motion runtime.",
    sections: [
      {
        h: "Copy, paste, done",
        p: [
          "Each Library card has a code panel. Copy the whole block, including its style and script tags, and paste it where it should appear. Nothing in a snippet depends on another snippet.",
          "Snippets read var(--accent), var(--card), var(--line), var(--ink) and var(--body) with fallbacks. Define those once at :root and every component follows.",
        ],
      },
      {
        h: "The motion runtime",
        p: [
          "Two files, one include: goodwork-motion.css and goodwork-motion.js. Add a class such as gw-shimmer or gw-aurora, or a data attribute such as data-gw-reveal, data-gw-count or data-gw-typing, to any element and it animates. Everything switches off under prefers-reduced-motion.",
        ],
        code: '<link rel="stylesheet" href="/goodwork/motion/goodwork-motion.css">\n<script src="/goodwork/motion/goodwork-motion.js" defer></script>',
      },
      {
        h: "Using snippets inside a framework",
        p: [
          "In React, paste the markup into a component and move the style block into a stylesheet or a CSS module. Scripted snippets initialise on load; call the init function again after injecting dynamic content.",
        ],
      },
    ],
    related: [{ label: "Getting started", to: "/docs/getting-started" }, { label: "Commercial licence", to: "/legal/licence" }],
  },
  {
    slug: "brand-tokens",
    title: "Brand tokens",
    summary: "The one file that changes between two sites built on the engine.",
    sections: [
      {
        h: "The knob",
        p: [
          "brand.css is the only file that changes between two sites. Paste a new brand's values and the entire site reskins: colour, type, corners, light and dark. Nothing in the HTML or the block CSS references a raw colour.",
          "Seven blocks: the accent family, the neutrals, fonts, corner radius, the dark band, the hero scrim and shadows. Two themes ship side by side; a site can lead with either.",
        ],
        code: ":root {\n  --accent: #3366FF;\n  --accent-2: #7A5CFF;\n  --accent-ink: #2E5AE6;\n  --cream: #FFFFFF;\n  --card: #FFFFFF;\n  --line: #EAEAEA;\n  --ink: #111111;\n  --body: #555555;\n  --font-head: 'Poppins', sans-serif;\n  --font-body: 'Poppins', sans-serif;\n  --radius: 12px;\n}",
      },
      {
        h: "Engine versus brand",
        p: [
          "The engine never changes: block structure, block CSS, motions, layout grid and the two-theme machinery. The brand is the paste: accent colour, neutral palette, fonts, radius, logo, copy and imagery. If you are editing block CSS to change a colour, that colour wants to be a token.",
        ],
      },
    ],
    related: [{ label: "Brand Guide System", to: "/systems/brand-guide" }, { label: "Getting started", to: "/docs/getting-started" }],
  },
  {
    slug: "licence-summary",
    title: "Licence summary",
    summary: "What a Library or Studio licence lets you do, in plain words.",
    sections: [
      {
        h: "In short",
        p: [
          "Build finished websites and systems for yourself or your clients. Modify the code for those projects. Keep what you download. Do not redistribute, share, sublicense or sell the raw source, and do not build a competing template library or UI kit from it.",
          "The readable principles are on the commercial licence page, and the full wording is marked for solicitor review before it becomes binding.",
        ],
      },
    ],
    related: [{ label: "Commercial licence", to: "/legal/licence" }, { label: "Refund policy", to: "/legal/refunds" }],
  },
];

export const DOC = Object.fromEntries(DOCS.map((d) => [d.slug, d]));
