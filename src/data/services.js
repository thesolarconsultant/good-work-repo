// Single source of truth for everything we sell.
//
// billing is derived from the prices:
//   oneTime only            -> "One-off"
//   oneTime + monthly       -> "Build + retainer"
//   monthly only            -> "Monthly retainer"
// poa: true  -> price not published yet; excluded from the running total.

export const SERVICES = [
  // ---- Core builds -------------------------------------------------------
  {
    id: "website",
    name: "Website",
    category: "Core builds",
    note: "Hand-built, not a template. The pages your customers actually need, fast on a phone, and structured so Google can read it.",
    oneTime: 750,
  },
  {
    id: "brand",
    name: "Full brand identity & logo",
    category: "Core builds",
    note: "Logo suite, colour palette, type scale and written usage rules — supplied as files you own and can hand to any printer or supplier.",
    oneTime: 500,
  },
  {
    id: "verification",
    name: "Google & Meta business verification",
    category: "Core builds",
    note: "Google Business Profile and Meta pages claimed, verified and filled in properly, so you appear in local search and maps with the right details.",
    oneTime: 120,
  },
  {
    id: "contracts",
    name: "Company contracts — wording & design",
    category: "Core builds",
    note: "Terms written for your trade and laid out so customers actually read and sign them. Supplied as print-ready hard copy and a digital version that can be signed on a phone.",
    oneTime: 350,
  },

  // ---- Content Console ---------------------------------------------------
  {
    id: "console",
    name: "Content Console",
    category: "Content Console",
    note: "One dashboard that keeps the business looking active without anyone sitting down to write. Blogs, social posts, WhatsApp and email templates, signatures and staff ID — drafted for you, approved and scheduled by you.",
    oneTime: 400,
    monthly: 150,
  },

  // ---- Automation & lead capture ----------------------------------------
  {
    id: "whatsapp-bot",
    name: "Always-on WhatsApp/Telegram booking & qualifying",
    category: "Automation & lead capture",
    note: "A number that replies instantly at 9pm on a Sunday, asks the questions you'd ask, and puts a real appointment in the diary.",
    oneTime: 600,
    monthly: 80,
  },
  {
    id: "missed-call",
    name: "Missed-call answering",
    category: "Automation & lead capture",
    note: "Picks up the calls you can't, books a callback slot or routes the caller straight to WhatsApp, and passes you the details. No lead goes cold overnight.",
    oneTime: 300,
    monthly: 60,
  },
  {
    id: "quoting-app",
    name: "Quick quoting & contracting app, white-labelled",
    category: "Automation & lead capture",
    note: "Your pricing built into an app under your own name, with a live pricing engine inside it: base rate plus variables, Good/Better/Best presets, margin floors you set, and a quote that flows straight into a contract and a deposit link.",
    oneTime: 1500,
    monthly: 50,
  },

  // ---- Growth & reporting ------------------------------------------------
  {
    id: "ga4",
    name: "GA4 setup",
    category: "Growth & reporting",
    note: "Analytics configured around the things that matter — calls, form fills, WhatsApp taps — so you can see which marketing actually pays.",
    oneTime: 150,
  },
  {
    id: "meta-ads",
    name: "Meta ads — setup, running, optimising, monthly reporting",
    category: "Growth & reporting",
    note: "Campaigns built, launched and managed month to month, with a plain-English report on spend, leads and what each lead cost.",
    oneTime: 200,
    monthly: 300,
  },

  // ---- AI & always-on support -------------------------------------------
  {
    id: "voice-agent",
    name: "Voice agent",
    category: "AI & always-on support",
    note: "A voice that answers the phone in your company's name, handles the routine questions, takes the details and books the job. Priced monthly.",
    poa: true,
    monthlyOnly: true,
  },
  {
    id: "ai-agent-team",
    name: "AI agent team",
    category: "AI & always-on support",
    note: "A set of agents covering the jobs nobody has time for — chasing quotes, following up leads, prepping reports, keeping records straight — working together rather than one bot doing everything.",
    poa: true,
  },
  {
    id: "chatbot",
    name: "Chat bot",
    category: "AI & always-on support",
    note: "On-site chat trained on your services, pricing and coverage area. Answers instantly, captures the enquiry, and hands over to a human when it should.",
    poa: true,
  },
  {
    id: "support-247",
    name: "24/7 support",
    category: "AI & always-on support",
    note: "Round-the-clock cover for your customers and your systems, so out-of-hours enquiries and overnight faults aren't waiting until Monday.",
    poa: true,
  },

  // ---- Platforms & systems ----------------------------------------------
  {
    id: "open-crm",
    name: "Open CRM",
    category: "Platforms & systems",
    note: "One place holding every customer, enquiry, quote and job — open, so your data stays yours and other tools can plug into it rather than fight it.",
    poa: true,
  },
  {
    id: "booking-system",
    name: "Booking system",
    category: "Platforms & systems",
    note: "Real availability customers can book against, tied to your calendar and your team, with confirmations and reminders that cut no-shows.",
    poa: true,
  },
  {
    id: "payment-system",
    name: "Payment system",
    category: "Platforms & systems",
    note: "Deposits, balances and recurring payments taken properly — card, bank transfer or link — reconciled against the job instead of the bank statement.",
    poa: true,
  },
  {
    id: "ecommerce",
    name: "Ecommerce",
    category: "Platforms & systems",
    note: "A shop that fits how you actually sell: products, packages or bookable services, with stock, delivery and tax set up correctly from day one.",
    poa: true,
  },
  {
    id: "mobile-app",
    name: "Mobile app",
    category: "Platforms & systems",
    note: "A branded app for customers or for your team on site — quotes, jobs, photos, sign-offs — on iOS and Android from one build.",
    poa: true,
  },

  // ---- Brand extras ------------------------------------------------------
  {
    id: "social-setup",
    name: "Social media account setup",
    category: "Brand extras",
    note: "Profiles built and optimised across Meta, LinkedIn, TikTok and Google Business Profile, seeded with the first posts so launch day isn't an empty page.",
    oneTime: 250,
  },
];

export const CATEGORIES = [...new Set(SERVICES.map((s) => s.category))];

// What each of the Content Console's modules actually does.
export const CONSOLE_MODULES = [
  { name: "Blog generator + scheduler", note: "Drafts written in your voice on the subjects your customers are searching for, queued weeks ahead." },
  { name: "Social media posts + scheduler", note: "A month of posts generated and scheduled in one sitting — job photos, offers, seasonal reminders." },
  { name: "WhatsApp message templates", note: "Saved replies for the twenty questions you answer every week, so anyone in the office answers them the same way." },
  { name: "Email templates", note: "Quotes, follow-ups, reminders and review requests, all in the same tone and branding." },
  { name: "Email signature strip generator", note: "Add a staff member, get their signature. No more copying someone else's and editing the name." },
  { name: "ID badge & staff card generator", note: "Print-ready badges and cards for new starters, generated straight from your brand files." },
];

export function billingOf(s) {
  if (s.monthlyOnly || (s.monthly && !s.oneTime)) return "Monthly retainer";
  if (s.monthly) return "Build + retainer";
  return "One-off";
}

export function formatGBP(n) {
  return n.toLocaleString("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });
}

export function priceLabel(s) {
  if (s.poa) return { main: "On enquiry", sub: s.monthlyOnly ? "monthly" : null };
  return {
    main: `${formatGBP(s.oneTime)}${s.oneTime ? " setup" : ""}`,
    sub: s.monthly ? `+ ${formatGBP(s.monthly)}/mo` : null,
  };
}
