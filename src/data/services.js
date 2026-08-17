// Single source of truth for everything we offer.
//
// No prices anywhere — the site says what we do, the client picks what they
// want, the number comes from the conversation.
//
// billing: "one-off"        -> built once, yours to keep
//          "build+retainer" -> built once, then runs monthly
//          "retainer"       -> monthly only

export const BILLING_LABELS = {
  "one-off": "One-off build",
  "build+retainer": "Build + monthly",
  retainer: "Monthly",
};

export const SERVICES = [
  // ---- Core builds -------------------------------------------------------
  {
    id: "website",
    name: "Website",
    category: "Core builds",
    billing: "one-off",
    note: "Hand-built, not a template. The pages your customers actually need, fast on a phone, and structured so Google can read it.",
  },
  {
    id: "brand",
    name: "Full brand identity & logo",
    category: "Core builds",
    billing: "one-off",
    note: "Logo suite, colour palette, type scale and written usage rules — supplied as files you own and can hand to any printer or supplier.",
  },
  {
    id: "verification",
    name: "Google & Meta business verification",
    category: "Core builds",
    billing: "one-off",
    note: "Google Business Profile and Meta pages claimed, verified and filled in properly, so you appear in local search and maps with the right details.",
  },
  {
    id: "contracts",
    name: "Company contracts — wording & design",
    category: "Core builds",
    billing: "one-off",
    note: "Terms written for your trade and laid out so customers actually read and sign them. Print-ready hard copy plus a digital version that can be signed on a phone.",
  },

  // ---- Content Console ---------------------------------------------------
  {
    id: "console",
    name: "Content Console",
    category: "Content Console",
    billing: "build+retainer",
    note: "One dashboard that keeps the business looking active without anyone sitting down to write. Everything below sits inside it.",
  },
  {
    id: "console-blog",
    name: "Blog generator + scheduler",
    category: "Content Console",
    billing: "build+retainer",
    note: "Drafts written in your voice on the subjects your customers are searching for, queued weeks ahead.",
  },
  {
    id: "console-social",
    name: "Social media posts + scheduler",
    category: "Content Console",
    billing: "build+retainer",
    note: "A month of posts generated and scheduled in one sitting — job photos, offers, seasonal reminders.",
  },
  {
    id: "console-whatsapp",
    name: "WhatsApp message templates",
    category: "Content Console",
    billing: "build+retainer",
    note: "Saved replies for the twenty questions you answer every week, so anyone in the office answers them the same way.",
  },
  {
    id: "console-email",
    name: "Email templates",
    category: "Content Console",
    billing: "build+retainer",
    note: "Quotes, follow-ups, reminders and review requests, all in the same tone and branding.",
  },
  {
    id: "console-signature",
    name: "Email signature strip generator",
    category: "Content Console",
    billing: "build+retainer",
    note: "Add a staff member, get their signature. No more copying someone else's and editing the name.",
  },
  {
    id: "console-badges",
    name: "ID badge & staff card generator",
    category: "Content Console",
    billing: "build+retainer",
    note: "Print-ready badges and cards for new starters, generated straight from your brand files.",
  },

  // ---- Automation & lead capture ----------------------------------------
  {
    id: "whatsapp-bot",
    name: "Always-on WhatsApp/Telegram booking & qualifying",
    category: "Automation & lead capture",
    billing: "build+retainer",
    note: "A number that replies instantly at 9pm on a Sunday, asks the questions you'd ask, and puts a real appointment in the diary.",
  },
  {
    id: "missed-call",
    name: "Missed-call answering",
    category: "Automation & lead capture",
    billing: "build+retainer",
    note: "Picks up the calls you can't, books a callback slot or routes the caller straight to WhatsApp, and passes you the details. No lead goes cold overnight.",
  },
  {
    id: "quoting-app",
    name: "Quick quoting & contracting app, white-labelled",
    category: "Automation & lead capture",
    billing: "build+retainer",
    note: "Your pricing built into an app under your own name, with a live pricing engine inside it: base rate plus variables, Good/Better/Best presets, margin floors you set, and a quote that flows straight into a contract and a deposit link.",
  },

  // ---- Growth & reporting ------------------------------------------------
  {
    id: "ga4",
    name: "GA4 setup",
    category: "Growth & reporting",
    billing: "one-off",
    note: "Analytics configured around the things that matter — calls, form fills, WhatsApp taps — so you can see which marketing actually pays.",
  },
  {
    id: "meta-ads",
    name: "Meta ads — setup, running, optimising, monthly reporting",
    category: "Growth & reporting",
    billing: "build+retainer",
    note: "Campaigns built, launched and managed month to month, with a plain-English report on spend, leads and what each lead cost.",
  },

  // ---- AI & always-on support -------------------------------------------
  {
    id: "voice-agent",
    name: "Voice agent",
    category: "AI & always-on support",
    billing: "retainer",
    note: "A voice that answers the phone in your company's name, handles the routine questions, takes the details and books the job.",
  },
  {
    id: "ai-agent-team",
    name: "AI agent team",
    category: "AI & always-on support",
    billing: "build+retainer",
    note: "A set of agents covering the jobs nobody has time for — chasing quotes, following up leads, prepping reports, keeping records straight — working together rather than one bot doing everything.",
  },
  {
    id: "chatbot",
    name: "Chat bot",
    category: "AI & always-on support",
    billing: "build+retainer",
    note: "On-site chat trained on your services, pricing and coverage area. Answers instantly, captures the enquiry, and hands over to a human when it should.",
  },
  {
    id: "support-247",
    name: "24/7 support",
    category: "AI & always-on support",
    billing: "retainer",
    note: "Round-the-clock cover for your customers and your systems, so out-of-hours enquiries and overnight faults aren't waiting until Monday.",
  },

  // ---- Platforms & systems ----------------------------------------------
  {
    id: "open-crm",
    name: "Open CRM",
    category: "Platforms & systems",
    billing: "build+retainer",
    note: "One place holding every customer, enquiry, quote and job — open, so your data stays yours and other tools plug into it rather than fight it.",
  },
  {
    id: "booking-system",
    name: "Booking system",
    category: "Platforms & systems",
    billing: "build+retainer",
    note: "Real availability customers can book against, tied to your calendar and your team, with confirmations and reminders that cut no-shows.",
  },
  {
    id: "payment-system",
    name: "Payment system",
    category: "Platforms & systems",
    billing: "build+retainer",
    note: "Deposits, balances and recurring payments taken properly — card, bank transfer or link — reconciled against the job instead of the bank statement.",
  },
  {
    id: "ecommerce",
    name: "Ecommerce",
    category: "Platforms & systems",
    billing: "build+retainer",
    note: "A shop that fits how you actually sell: products, packages or bookable services, with stock, delivery and tax set up correctly from day one.",
  },
  {
    id: "mobile-app",
    name: "Mobile app",
    category: "Platforms & systems",
    billing: "build+retainer",
    note: "A branded app for customers or for your team on site — quotes, jobs, photos, sign-offs — on iOS and Android from one build.",
  },

  // ---- Brand extras ------------------------------------------------------
  {
    id: "social-setup",
    name: "Social media account setup",
    category: "Brand extras",
    billing: "one-off",
    note: "Profiles built and optimised across Meta, LinkedIn, TikTok and Google Business Profile, seeded with the first posts so launch day isn't an empty page.",
  },
];

export const CATEGORIES = [...new Set(SERVICES.map((s) => s.category))];
