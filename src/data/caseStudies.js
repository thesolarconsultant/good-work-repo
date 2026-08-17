// Case studies — written from what's actually in each client's repository.
// Screenshots in public/case-studies are captures of the real, built sites.

export const CASE_STUDIES = [
  {
    id: "tsc",
    name: "The Solar Consultant",
    site: "thesolarconsultant.uk",
    sector: "Independent solar advisory · UK",
    tag: "Brand · Web · Systems · Creative",
    accent: "linear-gradient(135deg,#3366FF,#7A5CFF)",
    lede: "An advisory business built to sit on the homeowner's side of the table — paid a fee to design the system and rate the quotes, rather than paid commission to sell one.",
    brief: [
      "Most UK homeowners get three solar quotes, three different systems, and no way to tell which is right. The Solar Consultant charges an advisory fee to design the system properly from real consumption data, then rates every quote that comes back as good, fair or overpriced.",
      "That positioning only works if the site sells the idea of paying for advice before anyone has heard of you. It also has to serve two completely different audiences — homeowners looking for help, and installers applying to join the vetted network — without either feeling like an afterthought.",
    ],
    built: [
      { title: "The site", desc: "A React and Vite build on Tailwind, 20 routes, prerendered so each page is properly indexable rather than an empty shell waiting for JavaScript." },
      { title: "Two audiences, two journeys", desc: "Homeowner and installer paths run in parallel — separate navigation, separate landing pages, separate application and journey flows — off one codebase." },
      { title: "A staged, paid funnel", desc: "Free call, then paid stages with their own routes for payment and survey, so someone moves through the service in steps instead of being asked for everything at once." },
      { title: "Lead pipeline wired end to end", desc: "Four server endpoints push enquiries into GoHighLevel and fire conversion events back to Meta, so ad spend is measured against real leads, not clicks." },
      { title: "WhatsApp and automation, documented", desc: "The CRM automations, WhatsApp templates and pipeline stages are written down and aligned to the funnel — the follow-up runs the same way every time." },
      { title: "Creative generated from code", desc: "Six render pipelines produce static ads, animated ads, brand carousels, video covers, social previews and OG images from the same brand system. New campaign, no new design round." },
      { title: "Content and email engine", desc: "A content engine with drafts and roadmaps, plus a set of branded email templates covering booking, discovery calls and reminders." },
      { title: "Pitch decks inside the product", desc: "Customer and installer decks live as routes on the site, so a presentation is a link — always current, never a stale PDF attachment." },
      { title: "The portal — where the business actually runs", desc: "A separate application behind the site with three sides to it: 28 admin screens (CRM pipeline, deal engine, quote review, procurement, installer vetting, surveys, pricing, analytics), 19 client screens (their journey, system design, energy calculator, quotes, documents, install tracker) and 16 installer screens (onboarding, opportunities, submitting quotes, project and survey portals). 106 data entities and 120 backend functions underneath." },
      { title: "The Content Console, built in", desc: "The content operation lives inside that portal rather than in a separate tool — backlog, drafting, review and published pipelines for blogs, plus social copy packs, email templates and approved WhatsApp templates, sitting next to the CRM they feed." },
    ],
    facts: [
      { figure: "20", label: "routes, prerendered" },
      { figure: "63", label: "portal screens across 3 roles" },
      { figure: "6", label: "automated creative pipelines" },
      { figure: "4", label: "lead + tracking endpoints" },
    ],
    shots: [
      { src: "/case-studies/tsc-home.jpg", caption: "Homepage — the quote-rating idea stated in the hero, with a live sample review beside it." },
      { src: "/case-studies/tsc-installers.jpg", caption: "The installer side of the business — its own landing page and application journey." },
      { src: "/case-studies/tsc-blog.jpg", caption: "The blog, built for search: prerendered, structured and on-brand." },
    ],
    services: ["Website", "Full brand identity & logo", "Quick quoting & contracting app", "Open CRM", "Meta ads", "GA4 setup", "Content Console"],
  },
  {
    id: "8energy",
    name: "8energy",
    site: "8energy.uk",
    sector: "Home energy technology · UK",
    tag: "Brand · Web · Systems",
    accent: "linear-gradient(135deg,#7A5CFF,#FF2DB3)",
    lede: "One brand covering solar, batteries, heat pumps, EV charging, air conditioning and voltage optimisation — and a site that makes it look like a specialist in each, not a generalist in all.",
    brief: [
      "8energy doesn't sell one product, it covers the whole house. The risk with that is looking like a jack of all trades: a single 'services' page with six bullet points convinces nobody who is about to spend five figures on a heat pump.",
      "So every service line got built out properly, with its own page, its own hero and its own argument — and the whole thing hangs off one lead route: a free energy analysis based on the customer's real data, before anything is quoted or sold.",
    ],
    built: [
      { title: "34 pages, hand-built", desc: "Static HTML and CSS, no CMS and no page-builder weight. It loads fast on a phone in a driveway, which is where these pages actually get read." },
      { title: "Eleven service lines, each a real page", desc: "Solar, batteries, heat pumps, EV chargers, air conditioning, voltage optimisation, energy management, retrofit, maintenance plans, commercial and commercial batteries — each argued on its own terms." },
      { title: "The free energy analysis funnel", desc: "One clear lead route running through the whole site, with a qualifying form that captures what the team needs before a call." },
      { title: "A projection calculator", desc: "A live solar and battery projection tool, so a visitor gets a real number on the spot instead of a promise that someone will be in touch." },
      { title: "The Content Studio", desc: "A React app on its own subdomain with an email builder and template system, plus a branded login page on the main site — the content operation, running as its own product." },
      { title: "Proof, not adjectives", desc: "Gallery, reviews, FAQ, a published roadmap and a pricing-and-guarantees page that puts the commercial terms in writing." },
      { title: "Video-led design", desc: "Four background films across the site — including warehouse solar for the commercial pages — cut and compressed to stay fast." },
      { title: "Editorial that answers real questions", desc: "A blog with articles taking on the questions customers actually ask: is a battery worth it, heat pump myths, the truth about voltage optimisation, start with your data." },
    ],
    facts: [
      { figure: "34", label: "pages built" },
      { figure: "11", label: "service lines" },
      { figure: "1", label: "Content Studio app" },
      { figure: "4", label: "background films" },
    ],
    shots: [
      { src: "/case-studies/8energy-home.jpg", caption: "Homepage — one brand, the whole house, with the free analysis as the single lead route." },
      { src: "/case-studies/8energy-solar.jpg", caption: "A service page: solar gets a full argument of its own, as do the other ten." },
      { src: "/case-studies/8energy-calculator.jpg", caption: "The projection calculator — a real number before anyone picks up the phone." },
      { src: "/case-studies/8energy-software.jpg", caption: "The software page: the technology behind every install, sold as a differentiator." },
    ],
    services: ["Website", "Full brand identity & logo", "Content Console", "Always-on WhatsApp booking", "Google & Meta business verification"],
  },
];
