// =========================================================
// Workspace schema
//
// A workspace's schema is a set of object definitions, each with fields and
// optionally a pipeline. Clients define these themselves, so every definition
// arriving here is untrusted input from a form — a slug becomes part of an API
// path and a JSONB key, and both are places a bad string does real damage.
//
// The rule this file enforces: a workspace can be reshaped at any time, but it
// can never be put into a state that loses data or breaks a record already
// stored. Renaming a field's *label* is free. Changing its *slug* or its type
// is a migration, and is refused here rather than half-done at 2am.
// =========================================================

import { FIELD_TYPES, OPTION_TYPES, parseValue } from "./fields.js";

// A slug is used as an object key, a URL segment and a form input name, so it
// gets the intersection of what all three tolerate. Leading letter, because a
// leading digit is awkward in too many contexts to be worth the argument.
export const SLUG_RE = /^[a-z][a-z0-9_]{0,38}[a-z0-9]$|^[a-z]$/;

// Slugs we need for ourselves. A client field called `id` would shadow the
// record's own id everywhere it is spread into an object.
const RESERVED = new Set([
  "id", "workspace_id", "object", "created_at", "updated_at", "created_by",
  "deleted_at", "stage", "data", "__proto__", "constructor", "prototype",
]);

export class SchemaError extends Error {
  constructor(message, path) {
    super(message);
    this.name = "SchemaError";
    this.path = path;
  }
}

const fail = (message, path) => { throw new SchemaError(message, path); };

/** Turn anything a human typed into a usable slug. */
export function slugify(input) {
  return String(input || "")
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/^([0-9])/, "f$1")
    .slice(0, 40)
    .replace(/_+$/, "");
}

function checkSlug(slug, path) {
  if (!slug) fail("needs a name", path);
  if (!SLUG_RE.test(slug)) {
    fail(`"${slug}" isn't a usable name — lowercase letters, numbers and underscores`, path);
  }
  if (RESERVED.has(slug)) fail(`"${slug}" is a reserved name`, path);
}

function normaliseOptions(raw, path) {
  if (!Array.isArray(raw) || raw.length === 0) fail("needs at least one choice", path);
  const seen = new Set();
  return raw.map((opt, i) => {
    const label = String(typeof opt === "string" ? opt : opt?.label || "").trim();
    if (!label) fail("has a choice with no label", `${path}[${i}]`);
    const id = slugify(typeof opt === "object" && opt?.id ? opt.id : label);
    checkSlug(id, `${path}[${i}]`);
    if (seen.has(id)) fail(`has two choices called "${label}"`, `${path}[${i}]`);
    seen.add(id);
    return { id, label, colour: typeof opt === "object" ? opt?.colour || null : null };
  });
}

/** Validate and normalise one field definition. */
export function defineField(raw, path = "field") {
  const slug = raw.slug ? String(raw.slug) : slugify(raw.label);
  checkSlug(slug, path);

  const label = String(raw.label || "").trim() || slug;
  const type = String(raw.type || "text");
  if (!FIELD_TYPES[type]) fail(`has an unknown type "${type}"`, `${path}.type`);

  const def = {
    slug,
    label,
    type,
    required: Boolean(raw.required),
    help: raw.help ? String(raw.help).slice(0, 300) : null,
    // Shown in list views and on the record card without opening it.
    summary: Boolean(raw.summary),
  };

  if (OPTION_TYPES.includes(type)) def.options = normaliseOptions(raw.options, `${path}.options`);
  if (type === "relation") {
    const target = raw.relatedObject ? slugify(raw.relatedObject) : "";
    checkSlug(target, `${path}.relatedObject`);
    def.relatedObject = target;
  }
  if (type === "number") {
    if (raw.integer) def.integer = true;
    if (raw.min !== undefined) def.min = Number(raw.min);
    if (raw.max !== undefined) def.max = Number(raw.max);
  }
  if (type === "currency") def.currency = String(raw.currency || "GBP").toUpperCase();

  if (raw.default !== undefined && raw.default !== null && raw.default !== "") {
    const parsed = parseValue({ ...def, required: false }, raw.default);
    if (!parsed.ok) fail(`has a default that ${parsed.error}`, `${path}.default`);
    def.default = parsed.value;
  }

  return def;
}

/** Validate and normalise one object definition, fields and all. */
export function defineObject(raw, path = "object") {
  const slug = raw.slug ? slugify(raw.slug) : slugify(raw.namePlural || raw.name);
  checkSlug(slug, `${path}.slug`);

  const fields = [];
  const seen = new Set();
  for (const [i, f] of (raw.fields || []).entries()) {
    const def = defineField(f, `${path}.fields[${i}]`);
    if (seen.has(def.slug)) fail(`has two fields called "${def.slug}"`, `${path}.fields[${i}]`);
    seen.add(def.slug);
    fields.push(def);
  }
  if (fields.length === 0) fail("needs at least one field", `${path}.fields`);

  // Every record needs something to call itself in a list. Default to the
  // first text field rather than making the client choose on day one.
  const titleField = raw.titleField ? slugify(raw.titleField)
    : (fields.find((f) => f.summary && f.type === "text") || fields.find((f) => f.type === "text") || fields[0]).slug;
  if (!seen.has(titleField)) fail(`points its title at a missing field "${titleField}"`, `${path}.titleField`);

  const object = {
    slug,
    name: String(raw.name || slug).trim(),
    namePlural: String(raw.namePlural || `${raw.name || slug}s`).trim(),
    icon: raw.icon ? String(raw.icon).slice(0, 8) : null,
    titleField,
    fields,
  };

  if (raw.pipeline) {
    const stages = normaliseOptions(raw.pipeline.stages, `${path}.pipeline.stages`);
    object.pipeline = {
      label: String(raw.pipeline.label || "Pipeline").trim(),
      stages,
      // Terminal stages stop a deal counting towards the open pipeline value.
      won: raw.pipeline.won ? slugify(raw.pipeline.won) : null,
      lost: raw.pipeline.lost ? slugify(raw.pipeline.lost) : null,
    };
    for (const key of ["won", "lost"]) {
      const value = object.pipeline[key];
      if (value && !stages.some((s) => s.id === value)) {
        fail(`marks a "${key}" stage that isn't in the pipeline`, `${path}.pipeline.${key}`);
      }
    }
  }

  return object;
}

/** Validate a whole workspace schema and index it for lookup. */
export function defineSchema(objects) {
  const list = [];
  const seen = new Set();
  for (const [i, raw] of (objects || []).entries()) {
    const object = defineObject(raw, `objects[${i}]`);
    if (seen.has(object.slug)) fail(`has two objects called "${object.slug}"`, `objects[${i}]`);
    seen.add(object.slug);
    list.push(object);
  }

  // Relations are checked only once every object is known, so definition order
  // doesn't matter and two objects can point at each other.
  for (const object of list) {
    for (const field of object.fields) {
      if (field.type === "relation" && !seen.has(field.relatedObject)) {
        fail(
          `"${object.slug}.${field.slug}" links to "${field.relatedObject}", which doesn't exist`,
          `objects.${object.slug}.fields.${field.slug}`,
        );
      }
    }
  }

  return {
    objects: list,
    byslug: Object.fromEntries(list.map((o) => [o.slug, o])),
    get(slug) { return this.byslug[slug] || null; },
  };
}

/**
 * What it would take to get from one version of an object to the next.
 *
 * A CRM that lets a client edit their schema needs to answer "is this safe?"
 * before it answers "is this saved?". Anything returned in `breaking` will lose
 * or invalidate data already in the workspace, so it needs a confirmation and a
 * backfill — never a silent save.
 */
export function diffObject(before, after) {
  const safe = [];
  const breaking = [];
  const beforeFields = new Map(before.fields.map((f) => [f.slug, f]));
  const afterFields = new Map(after.fields.map((f) => [f.slug, f]));

  for (const [slug, field] of beforeFields) {
    if (!afterFields.has(slug)) {
      breaking.push({ kind: "field_removed", field: slug, detail: `"${field.label}" and everything stored in it` });
      continue;
    }
    const next = afterFields.get(slug);
    if (next.type !== field.type) {
      breaking.push({ kind: "type_changed", field: slug, detail: `${field.type} → ${next.type}` });
    }
    if (next.required && !field.required) {
      breaking.push({ kind: "now_required", field: slug, detail: `existing records with no "${next.label}" become invalid` });
    }
    if (OPTION_TYPES.includes(field.type) && OPTION_TYPES.includes(next.type)) {
      const kept = new Set((next.options || []).map((o) => o.id));
      for (const opt of field.options || []) {
        if (!kept.has(opt.id)) {
          breaking.push({ kind: "option_removed", field: slug, detail: `choice "${opt.label}"` });
        }
      }
    }
    if (next.label !== field.label) safe.push({ kind: "renamed", field: slug, detail: `${field.label} → ${next.label}` });
  }

  for (const [slug, field] of afterFields) {
    if (!beforeFields.has(slug)) {
      // A new required field with no default is breaking for the same reason
      // `now_required` is: every existing record instantly fails validation.
      const target = field.required && field.default === undefined ? breaking : safe;
      target.push({ kind: "field_added", field: slug, detail: field.label });
    }
  }

  return { safe, breaking, isBreaking: breaking.length > 0 };
}
