// Turning a finished scope into the things we need to send, and the fallback
// for when sending fails.
//
// Deliberately not inside the component: the summary is the actual product of
// the whole flow, and it needs to be reproducible for the email fallback and
// readable on its own.

import { SERVICES, BILLING_LABELS } from "../data/services";
import { QUESTIONS } from "../data/scope";

export const CONTACT_EMAIL = "hello@goodwork.agency";

/** The answers, in the words the client actually read on screen. */
export function answerSummary(answers) {
  const out = [];
  for (const q of QUESTIONS) {
    const answer = answers[q.id];
    if (answer == null) continue;
    const chosen = (Array.isArray(answer) ? answer : [answer])
      .map((id) => q.options.find((o) => o.id === id)?.label)
      .filter(Boolean);
    if (chosen.length) out.push({ question: q.question, answers: chosen });
  }
  return out;
}

/** The chosen services, grouped the way the site groups them. */
export function serviceSummary(serviceIds) {
  const chosen = SERVICES.filter((s) => serviceIds.includes(s.id));
  const groups = new Map();
  for (const s of chosen) {
    if (!groups.has(s.category)) groups.set(s.category, []);
    groups.get(s.category).push(s);
  }
  return [...groups.entries()].map(([category, items]) => ({ category, items }));
}

/** One plain-text block — what lands in the inbox, and the mailto fallback. */
export function asPlainText({ contact, answers, serviceIds }) {
  const lines = [];
  lines.push("NEW ENQUIRY — scope builder");
  lines.push("");
  lines.push(`Name:     ${contact.name}`);
  lines.push(`Email:    ${contact.email}`);
  lines.push(`Phone:    ${contact.phone}`);
  if (contact.business) lines.push(`Business: ${contact.business}`);
  lines.push("");

  lines.push("WHAT THEY SAID");
  for (const { question, answers: given } of answerSummary(answers)) {
    lines.push(`  ${question}`);
    for (const a of given) lines.push(`    - ${a}`);
  }
  lines.push("");

  lines.push(`WHAT THEY WANT QUOTING (${serviceIds.length})`);
  for (const { category, items } of serviceSummary(serviceIds)) {
    lines.push(`  ${category}`);
    for (const s of items) lines.push(`    - ${s.name} (${BILLING_LABELS[s.billing]})`);
  }

  if (contact.message?.trim()) {
    lines.push("");
    lines.push("ANYTHING ELSE");
    lines.push(`  ${contact.message.trim()}`);
  }
  return lines.join("\n");
}

/**
 * The escape hatch. If the endpoint isn't deployed or the network drops, the
 * client should not lose ten minutes of answers — this hands them the whole
 * thing pre-written in their own mail client.
 *
 * mailto has a practical length ceiling in some clients, so the body is
 * trimmed rather than silently truncated by the browser.
 */
export function mailtoFallback(payload) {
  const body = asPlainText(payload).slice(0, 1800);
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
    `Enquiry — ${payload.contact.name || "scope builder"}`,
  )}&body=${encodeURIComponent(body)}`;
}
