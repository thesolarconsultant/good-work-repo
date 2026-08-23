// The guided scope builder — questions, and the rules that turn answers into
// a recommendation.
//
// Kept separate from the component on purpose: what we ask and what we
// recommend is copy and commercial judgement, and both should be editable
// without touching React. Every `services` array below is a list of real ids
// from data/services.js — `validateScope()` at the bottom proves it, so a
// typo shows up as a build-time console error rather than a service that
// silently never gets recommended.
//
// No prices anywhere, same as the rest of the site: this produces a scope,
// and the number comes from the conversation.

import { SERVICES } from "./services";

export const QUESTIONS = [
  {
    id: "business",
    kicker: "First things first",
    question: "What sort of business are we talking about?",
    help: "This just tells us what normally works for people like you.",
    multi: false,
    options: [
      {
        id: "trade",
        label: "Trade or field service",
        desc: "You or your team are out on jobs — installs, maintenance, callouts.",
        services: ["quoting-app", "missed-call"],
      },
      {
        id: "professional",
        label: "Professional services",
        desc: "Advice, consultancy or a practice. The work is you and your people.",
        services: ["booking-system"],
      },
      {
        id: "retail",
        label: "Retail or ecommerce",
        desc: "You sell products, online or from a premises.",
        services: ["ecommerce", "payment-system"],
      },
      {
        id: "other",
        label: "Something else",
        desc: "Tell us properly at the end and we'll work it out.",
        services: [],
      },
    ],
  },
  {
    id: "problem",
    kicker: "The honest bit",
    question: "What's actually not working?",
    help: "Pick as many as ring true. This drives most of what we suggest.",
    multi: true,
    options: [
      {
        id: "looks-dated",
        label: "We look out of date",
        desc: "The brand and the website don't match how good the work actually is.",
        services: ["website", "brand"],
      },
      {
        id: "not-enough",
        label: "Not enough enquiries",
        desc: "It's quiet, or it's feast and famine, and you can't see why.",
        services: ["meta-ads", "ga4", "verification"],
      },
      {
        id: "missing-leads",
        label: "Enquiries slip through",
        desc: "Calls get missed, messages sit unanswered, follow-up depends on remembering.",
        services: ["missed-call", "whatsapp-bot", "open-crm"],
      },
      {
        id: "gone-quiet",
        label: "We've gone quiet online",
        desc: "Nothing posted in months, because nobody has time to sit down and write it.",
        services: ["console", "console-social", "console-blog"],
      },
      {
        id: "admin",
        label: "Too much admin",
        desc: "Quoting, booking and chasing eat the evenings.",
        services: ["quoting-app", "booking-system", "open-crm", "contracts"],
      },
      {
        id: "cant-tell",
        label: "We can't tell what's working",
        desc: "Money goes out on marketing and nobody can say what came back.",
        services: ["ga4"],
      },
    ],
  },
  {
    id: "have",
    kicker: "What's already there",
    question: "What have you got already?",
    help: "Anything you tick, we won't suggest building again.",
    multi: true,
    options: [
      {
        id: "has-website",
        label: "A website we're happy with",
        desc: "It works, it's current, it does its job.",
        services: [],
        // Ticking this removes the rebuild from the recommendation.
        removes: ["website"],
      },
      {
        id: "has-brand",
        label: "A brand we're happy with",
        desc: "Logo, colours and type are settled and you're not revisiting them.",
        services: [],
        removes: ["brand"],
      },
      {
        id: "has-crm",
        label: "A CRM we actually use",
        desc: "Not a spreadsheet — something the whole team is in every day.",
        services: [],
        removes: ["open-crm"],
      },
      {
        id: "has-none",
        label: "Honestly, not much",
        desc: "Starting close to scratch.",
        services: ["website", "brand", "verification", "social-setup"],
      },
    ],
  },
  {
    id: "after",
    kicker: "After launch",
    question: "Once it's built, who keeps it running?",
    help: "There's no wrong answer — it changes what we'd recommend, not what it costs to build.",
    multi: false,
    options: [
      {
        id: "us",
        label: "You do — I want it off my plate",
        desc: "Content going out, ads managed, systems watched, a report we can read in two minutes.",
        services: ["console", "meta-ads", "support-247"],
      },
      {
        id: "shared",
        label: "We'll do it, with the tools set up",
        desc: "Build it so our own team can run it without needing a developer.",
        services: ["console"],
      },
      {
        id: "handover",
        label: "Build it and hand it over",
        desc: "One-off. Yours to keep, no monthly.",
        services: [],
        // A clean handover shouldn't come back full of monthly items.
        billingPreference: "one-off",
      },
    ],
  },
  {
    id: "answering",
    kicker: "Out of hours",
    question: "What happens when someone gets in touch at 9pm?",
    help: "Most enquiries arrive outside working hours.",
    multi: false,
    options: [
      {
        id: "nothing",
        label: "Nothing until the morning",
        desc: "And we probably lose a few that way.",
        services: ["whatsapp-bot", "voice-agent"],
      },
      {
        id: "someone",
        label: "Someone usually picks it up",
        desc: "It gets answered, but it's on somebody's evening.",
        services: ["whatsapp-bot"],
      },
      {
        id: "covered",
        label: "That's already covered",
        desc: "We've got something handling it.",
        services: [],
      },
    ],
  },
  {
    id: "when",
    kicker: "Last one",
    question: "When do you want this live?",
    help: "It won't change the scope — it tells us how to plan.",
    multi: false,
    options: [
      { id: "asap", label: "As soon as possible", desc: "There's a reason it's urgent.", services: [] },
      { id: "quarter", label: "Next few months", desc: "Planned, not panicked.", services: [] },
      { id: "exploring", label: "Just exploring", desc: "Working out what it would involve.", services: [] },
    ],
  },
];

// Anything a build genuinely can't go live without, once they're having a
// website at all.
const IMPLIED = {
  website: ["verification"],
  console: [],
};

/**
 * Turn a set of answers into a recommendation.
 *
 * answers: { [questionId]: string | string[] }
 *
 * Returns { serviceIds, reasons, billing } where `reasons` maps a service id
 * to the plain-English answers that put it there — the results screen shows
 * these, because "you need a CRM" lands very differently from "you need a CRM
 * because you said enquiries slip through".
 *
 * Pure and dependency-free so it can be reasoned about on its own.
 */
export function recommend(answers) {
  const picked = new Set();
  const removed = new Set();
  const reasons = {};
  let billing = null;

  for (const q of QUESTIONS) {
    const answer = answers[q.id];
    if (answer == null) continue;
    const chosenIds = Array.isArray(answer) ? answer : [answer];

    for (const optionId of chosenIds) {
      const option = q.options.find((o) => o.id === optionId);
      if (!option) continue;

      for (const serviceId of option.services || []) {
        picked.add(serviceId);
        (reasons[serviceId] ||= []).push(option.label);
      }
      for (const serviceId of option.removes || []) removed.add(serviceId);
      if (option.billingPreference) billing = option.billingPreference;
    }
  }

  // "We've already got one" always beats "you might want one" — otherwise
  // ticking `has-website` and a problem that implies a website still returns
  // a website rebuild, which reads as not having listened.
  for (const serviceId of removed) {
    picked.delete(serviceId);
    delete reasons[serviceId];
  }

  for (const serviceId of [...picked]) {
    for (const implied of IMPLIED[serviceId] || []) {
      if (removed.has(implied)) continue;
      if (!picked.has(implied)) {
        picked.add(implied);
        (reasons[implied] ||= []).push(`Goes with ${nameOf(serviceId)}`);
      }
    }
  }

  // A one-off handover shouldn't come back full of monthly line items.
  if (billing === "one-off") {
    for (const serviceId of [...picked]) {
      if (serviceOf(serviceId)?.billing === "retainer") {
        picked.delete(serviceId);
        delete reasons[serviceId];
      }
    }
  }

  return {
    serviceIds: [...picked].filter((id) => serviceOf(id)),
    reasons,
    billing,
  };
}

function serviceOf(id) {
  return SERVICES.find((s) => s.id === id);
}

function nameOf(id) {
  return serviceOf(id)?.name || id;
}

/**
 * Every id referenced above must exist. A typo here would mean a service that
 * can never be recommended and nobody would notice, so this shouts in dev.
 */
export function validateScope() {
  const known = new Set(SERVICES.map((s) => s.id));
  const bad = [];
  for (const q of QUESTIONS) {
    for (const o of q.options) {
      for (const id of [...(o.services || []), ...(o.removes || [])]) {
        if (!known.has(id)) bad.push(`${q.id}/${o.id} -> ${id}`);
      }
    }
  }
  for (const [id, list] of Object.entries(IMPLIED)) {
    if (!known.has(id)) bad.push(`IMPLIED key -> ${id}`);
    for (const implied of list) if (!known.has(implied)) bad.push(`IMPLIED ${id} -> ${implied}`);
  }
  return bad;
}
