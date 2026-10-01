// Validation and serialisation shared by every enquiry form. Kept away from
// the component so the plain-text summary — the thing that actually lands in
// the inbox — is reproducible for the email fallback.

import { CONTACT_EMAIL } from "./site";

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Deliberately loose: UK landlines, mobiles, +44, spaces, brackets and dashes
// are all normal, and rejecting a real number is worse than accepting an odd one.
export const PHONE_RE = /^[+()\d][\d\s()+.-]{7,}$/;
export const URL_RE = /^(https?:\/\/)?[a-z0-9-]+(\.[a-z0-9-]+)+([/?#].*)?$/i;

/** Returns { [fieldName]: message } for everything that fails. */
export function validate(fields, values) {
  const errors = {};
  for (const f of fields) {
    const raw = values[f.name];
    const isEmpty = Array.isArray(raw) ? raw.length === 0 : raw == null || String(raw).trim() === "";

    if (f.required && isEmpty) {
      errors[f.name] = f.requiredMessage || `${f.label} is required.`;
      continue;
    }
    if (isEmpty) continue;

    if (f.type === "email" && !EMAIL_RE.test(String(raw).trim())) {
      errors[f.name] = "That doesn't look like an email address.";
    } else if (f.type === "tel" && !PHONE_RE.test(String(raw).trim())) {
      errors[f.name] = "That doesn't look like a phone number.";
    } else if (f.type === "url" && !URL_RE.test(String(raw).trim())) {
      errors[f.name] = "That doesn't look like a web address.";
    } else if (f.type === "checkbox" && f.required && raw !== true) {
      errors[f.name] = f.requiredMessage || "Please confirm this to continue.";
    } else if (f.maxLength && String(raw).length > f.maxLength) {
      errors[f.name] = `Keep this under ${f.maxLength} characters.`;
    }
  }
  return errors;
}

export const isEmptyValue = (v) => v == null || v === "" || (Array.isArray(v) && v.length === 0);

/** A field's answer as a person reads it: option labels rather than ids. */
export function displayValue(f, v) {
  if (Array.isArray(v)) return v.map((id) => f.options?.find((o) => o.value === id)?.label || id).join(", ");
  if (f.type === "checkbox") return v === true ? "Yes" : "No";
  if (f.options) return f.options.find((o) => o.value === v)?.label || String(v);
  return String(v);
}

/** Step kickers and titles may be plain text or a function of the answers so far. */
export const resolveText = (text, values) => (typeof text === "function" ? text(values) : text);

/** The submission as one readable block — what lands in the inbox. */
export function asPlainText(form, values) {
  const lines = [`NEW ${form.title.toUpperCase()}`, `Form: ${form.id}`, ""];
  for (const f of form.fields) {
    const v = values[f.name];
    if (isEmptyValue(v)) continue;
    lines.push(`${f.label}:`);
    for (const line of displayValue(f, v).split("\n")) lines.push(`  ${line}`);
  }
  return lines.join("\n");
}

/**
 * POST one enquiry to /api/enquiry. Resolves only on a 2xx; anything else
 * throws an Error whose message is fit to show the person who typed it.
 * The server's 503 explains which environment variables are missing, which
 * is for whoever runs the site, so that goes to the console instead.
 */
export async function submitEnquiry(form, values) {
  let response;
  try {
    response = await fetch("/api/enquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ form: form.id, fields: values, text: asPlainText(form, values), page: window.location.pathname }),
    });
  } catch {
    throw new Error("The connection dropped before it reached us.");
  }
  if (response.ok) return;
  const detail = await response.json().catch(() => ({}));
  if (response.status === 503) {
    if (detail.error) console.warn(`enquiry: ${detail.error}`);
    throw new Error("Sending from the website isn't switched on yet.");
  }
  if (response.status === 404) throw new Error("The enquiry endpoint isn't deployed on this host yet.");
  throw new Error(detail.error || `The server returned ${response.status}.`);
}

/** If the endpoint is down, hand the whole thing to their mail client instead. */
export function mailtoFallback(form, values) {
  const body = asPlainText(form, values).slice(0, 1800);
  const who = values.name || values.applicantName || "";
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`${form.title}${who ? ` — ${who}` : ""}`)}&body=${encodeURIComponent(body)}`;
}

/** Initial state for a form: strings empty, multi-selects empty arrays, checkboxes false. */
export function initialValues(form, prefill = {}) {
  const out = {};
  for (const f of form.fields) {
    out[f.name] = f.type === "checkbox-group" ? [] : f.type === "checkbox" ? false : "";
  }
  for (const [k, v] of Object.entries(prefill)) if (k in out) out[k] = v;
  return out;
}
