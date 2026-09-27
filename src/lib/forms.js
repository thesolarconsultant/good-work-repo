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

/** The submission as one readable block — what lands in the inbox. */
export function asPlainText(form, values) {
  const lines = [`NEW ${form.title.toUpperCase()}`, `Form: ${form.id}`, ""];
  for (const f of form.fields) {
    const v = values[f.name];
    if (v == null || v === "" || (Array.isArray(v) && v.length === 0)) continue;
    const shown = Array.isArray(v)
      ? v.map((id) => f.options?.find((o) => o.value === id)?.label || id).join(", ")
      : f.type === "checkbox"
        ? v === true ? "Yes" : "No"
        : f.options
          ? f.options.find((o) => o.value === v)?.label || String(v)
          : String(v);
    lines.push(`${f.label}:`);
    for (const line of shown.split("\n")) lines.push(`  ${line}`);
  }
  return lines.join("\n");
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
