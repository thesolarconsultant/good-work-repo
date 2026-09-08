// =========================================================
// Field types
//
// The whole product rests on one decision: a client's schema is *data*, not
// code. A field is a row in `field_defs`, not a column in a table and not a
// property in a TypeScript interface. That is what lets two workspaces on the
// same deployment disagree about what a "customer" is without either of them
// getting a fork.
//
// This file is the registry that makes that safe. Every type knows how to take
// whatever arrived from a form, an import or a webhook and either turn it into
// its one canonical stored shape or reject it with a reason a human can read.
// Nothing writes to a record without going through here.
//
// No dependencies, no I/O, no framework — it runs in the API, in the browser
// and in a test, and it is the piece most worth having tests for.
// =========================================================

/** Reject strings long enough to be an attack rather than an answer. */
const MAX_TEXT = 2000;
const MAX_LONGTEXT = 100_000;

const ok = (value) => ({ ok: true, value });
const bad = (error) => ({ ok: false, error });

/** Empty in, empty out — "not answered" is a legitimate value for every type. */
const isBlank = (v) => v === null || v === undefined || v === "" ||
  (Array.isArray(v) && v.length === 0);

const asString = (v) => (typeof v === "string" ? v : String(v));

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Deliberately loose: international numbers are a swamp, and a CRM that
// refuses a real client's phone number is worse than one that stores a odd one.
const PHONE_RE = /^[+()\d][\d\s()+.-]{4,30}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const CURRENCY_RE = /^[A-Z]{3}$/;

/**
 * Each type is: how to coerce one value, and what it means to be empty.
 *
 * `parse(raw, def)` returns `{ok:true, value}` or `{ok:false, error}`.
 * `value` is the canonical stored form and is what ends up in the JSONB.
 */
export const FIELD_TYPES = {
  text: {
    label: "Text",
    empty: null,
    parse(raw) {
      const s = asString(raw).trim();
      if (s.length > MAX_TEXT) return bad(`must be ${MAX_TEXT} characters or fewer`);
      return ok(s === "" ? null : s);
    },
  },

  longtext: {
    label: "Long text",
    empty: null,
    parse(raw) {
      const s = asString(raw);
      if (s.length > MAX_LONGTEXT) return bad("is too long to store");
      return ok(s.trim() === "" ? null : s);
    },
  },

  number: {
    label: "Number",
    empty: null,
    parse(raw, def = {}) {
      // Strip thousands separators — people paste from spreadsheets.
      const n = typeof raw === "number" ? raw : Number(asString(raw).replace(/[,\s]/g, ""));
      if (!Number.isFinite(n)) return bad("must be a number");
      if (def.integer && !Number.isInteger(n)) return bad("must be a whole number");
      if (def.min !== undefined && n < def.min) return bad(`must be ${def.min} or more`);
      if (def.max !== undefined && n > def.max) return bad(`must be ${def.max} or less`);
      return ok(n);
    },
  },

  currency: {
    label: "Currency",
    empty: null,
    // Stored as { amount, currency }. Amount is a plain number in major units;
    // Twenty stores micros to dodge float error, but a CRM deal value is not a
    // ledger — and a number you cannot read in psql costs more than it saves.
    parse(raw, def = {}) {
      const fallback = def.currency || "GBP";
      if (typeof raw === "number") {
        return Number.isFinite(raw) ? ok({ amount: raw, currency: fallback }) : bad("must be an amount");
      }
      if (typeof raw === "string") {
        const n = Number(raw.replace(/[£$€,\s]/g, ""));
        if (!Number.isFinite(n)) return bad("must be an amount");
        return ok({ amount: n, currency: fallback });
      }
      if (raw && typeof raw === "object") {
        const n = Number(raw.amount);
        if (!Number.isFinite(n)) return bad("must be an amount");
        const code = asString(raw.currency || fallback).toUpperCase();
        if (!CURRENCY_RE.test(code)) return bad("has an unrecognised currency code");
        return ok({ amount: n, currency: code });
      }
      return bad("must be an amount");
    },
  },

  date: {
    label: "Date",
    empty: null,
    parse(raw) {
      const s = asString(raw).trim();
      // Accept a full instant and keep the day, so a datetime import doesn't fail.
      const day = s.length > 10 && !Number.isNaN(Date.parse(s))
        ? new Date(s).toISOString().slice(0, 10)
        : s;
      if (!DATE_RE.test(day)) return bad("must be a date (YYYY-MM-DD)");
      if (Number.isNaN(Date.parse(day))) return bad("is not a real date");
      return ok(day);
    },
  },

  datetime: {
    label: "Date and time",
    empty: null,
    parse(raw) {
      const s = raw instanceof Date ? raw.toISOString() : asString(raw).trim();
      const t = Date.parse(s);
      if (Number.isNaN(t)) return bad("must be a date and time");
      return ok(new Date(t).toISOString());
    },
  },

  boolean: {
    label: "Yes / no",
    empty: false,
    parse(raw) {
      if (typeof raw === "boolean") return ok(raw);
      const s = asString(raw).trim().toLowerCase();
      if (["true", "yes", "y", "1", "on"].includes(s)) return ok(true);
      if (["false", "no", "n", "0", "off"].includes(s)) return ok(false);
      return bad("must be yes or no");
    },
  },

  select: {
    label: "Choice",
    empty: null,
    parse(raw, def = {}) {
      const s = asString(raw).trim();
      const options = def.options || [];
      const hit = options.find((o) => o.id === s) ||
        // Match on label too, case-insensitively: imports carry what a human typed.
        options.find((o) => o.label.toLowerCase() === s.toLowerCase());
      if (!hit) return bad(`must be one of: ${options.map((o) => o.label).join(", ")}`);
      return ok(hit.id);
    },
  },

  multiselect: {
    label: "Choices",
    empty: [],
    parse(raw, def = {}) {
      const list = Array.isArray(raw) ? raw : asString(raw).split(",");
      const out = [];
      for (const item of list) {
        if (isBlank(item)) continue;
        const one = FIELD_TYPES.select.parse(item, def);
        if (!one.ok) return one;
        if (!out.includes(one.value)) out.push(one.value);
      }
      return ok(out);
    },
  },

  email: {
    label: "Email",
    empty: null,
    parse(raw) {
      const s = asString(raw).trim().toLowerCase();
      if (!EMAIL_RE.test(s)) return bad("must be an email address");
      if (s.length > 320) return bad("is too long to be an email address");
      return ok(s);
    },
  },

  phone: {
    label: "Phone",
    empty: null,
    parse(raw) {
      const s = asString(raw).trim().replace(/\s+/g, " ");
      if (!PHONE_RE.test(s)) return bad("must be a phone number");
      return ok(s);
    },
  },

  url: {
    label: "Link",
    empty: null,
    parse(raw) {
      let s = asString(raw).trim();
      if (!s) return bad("must be a link");
      // People type "goodwork.agency", not "https://goodwork.agency".
      if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
      let parsed;
      try {
        parsed = new URL(s);
      } catch {
        return bad("must be a link");
      }
      // Anything but http(s) in a field we later render as an anchor is a
      // stored-XSS delivery mechanism (javascript:, data:). Refuse at the door.
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return bad("must be an http or https link");
      }
      return ok(parsed.toString());
    },
  },

  relation: {
    label: "Linked record",
    empty: null,
    // Stored as the related record's id. Which object it points at is on the
    // field definition, so a relation can never silently change target.
    parse(raw, def = {}) {
      if (!def.relatedObject) return bad("has no target object configured");
      const s = typeof raw === "object" && raw ? asString(raw.id) : asString(raw);
      const id = s.trim();
      if (!id) return bad("must be a linked record");
      if (id.length > 64) return bad("is not a valid record reference");
      return ok(id);
    },
  },

  user: {
    label: "Team member",
    empty: null,
    parse(raw) {
      const s = typeof raw === "object" && raw ? asString(raw.id) : asString(raw);
      const id = s.trim();
      if (!id) return bad("must be a team member");
      if (id.length > 64) return bad("is not a valid team member reference");
      return ok(id);
    },
  },
};

export const FIELD_TYPE_IDS = Object.freeze(Object.keys(FIELD_TYPES));

/** Types that carry a fixed option list, and so need one configured. */
export const OPTION_TYPES = Object.freeze(["select", "multiselect"]);

/**
 * Coerce one value for one field definition.
 *
 * Blank is allowed unless the field is required — that check lives here rather
 * than in each type, so "required" means the same thing for all of them.
 */
export function parseValue(def, raw) {
  const type = FIELD_TYPES[def.type];
  if (!type) return bad(`has an unknown field type "${def.type}"`);

  if (isBlank(raw)) {
    if (def.required) return bad("is required");
    return ok(type.empty);
  }

  return type.parse(raw, def);
}

/** The value a brand-new record starts this field at. */
export function emptyValue(def) {
  if (def.default !== undefined && def.default !== null) {
    const parsed = parseValue(def, def.default);
    if (parsed.ok) return parsed.value;
  }
  return FIELD_TYPES[def.type]?.empty ?? null;
}
