import { useEffect, useId, useRef, useState } from "react";
import Button from "./Button";
import { FORMS } from "../data/forms";
import { validate, asPlainText, mailtoFallback, initialValues } from "../lib/forms";
import { track } from "../lib/analytics";
import { CONTACT_EMAIL } from "../lib/site";

/**
 * One component, every enquiry. Driven by the schemas in data/forms.js.
 *
 * - Validates on submit with accessible errors and focus management.
 * - Honeypot field bots fill and people never see.
 * - POSTs to /api/enquiry and believes only a 2xx. A 503 (unconfigured) or a
 *   network failure shows an honest error plus a mailto carrying everything
 *   typed, so no enquiry is ever silently lost.
 * - Keeps a draft in sessionStorage so a refresh doesn't cost ten minutes.
 */
export default function EnquiryForm({ formId, prefill = {}, compact = false, source }) {
  const form = FORMS[formId];
  const uid = useId();
  const storageKey = `gw:form:${formId}`;
  const [values, setValues] = useState(() => initialValues(form, prefill));
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | sending | sent | failed
  const [failure, setFailure] = useState("");
  const rootRef = useRef(null);
  const started = useRef(false);

  // Restore a draft, then keep it fresh. Prefill wins over the draft for the
  // keys it sets, so a "?topic=crm" link always lands on CRM.
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) || "null");
      if (saved && typeof saved === "object") setValues((v) => ({ ...v, ...saved, ...prefill }));
    } catch {
      // Storage disabled: the form still works, it just won't remember.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    if (status === "sent") return;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(values));
    } catch {
      // As above.
    }
  }, [values, storageKey, status]);

  const set = (name, value) => {
    if (!started.current) {
      started.current = true;
      track("service_enquiry_start", { form: formId, source });
    }
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  };

  async function onSubmit(e) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    // Bots fill in everything, including a field no person can see.
    if (data.get("website_url")) return;

    const found = validate(form.fields, values);
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      rootRef.current?.querySelector(`[name="${first}"]`)?.focus();
      return;
    }

    setStatus("sending");
    setFailure("");
    try {
      const response = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ form: formId, fields: values, text: asPlainText(form, values), page: window.location.pathname }),
      });
      if (!response.ok) {
        const detail = await response.json().catch(() => ({}));
        throw new Error(
          detail.error ||
            (response.status === 404 ? "The enquiry endpoint isn't deployed on this host yet." : `The server returned ${response.status}.`),
        );
      }
      setStatus("sent");
      track(form.event, { form: formId, source });
      try {
        sessionStorage.removeItem(storageKey);
      } catch {
        // Nothing to clear.
      }
    } catch (err) {
      setStatus("failed");
      setFailure(err.message || "Something went wrong sending it.");
    }
  }

  if (status === "sent") {
    return (
      <div className="gw-done" role="status" aria-live="polite">
        <span className="gw-done__tick" aria-hidden="true">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 10.5l4 4 8-9" />
          </svg>
        </span>
        <h3 className="gw-h3">{form.successTitle}</h3>
        <p className="gw-body">{form.successCopy}</p>
        <p className="gw-small gw-muted">
          If it's urgent, <a className="gw-link" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> reaches us directly.
        </p>
      </div>
    );
  }

  return (
    <form className="gw-form" onSubmit={onSubmit} noValidate ref={rootRef} aria-describedby={`${uid}-intro`}>
      {!compact && (
        <p className="gw-body" id={`${uid}-intro`}>
          {form.intro}
        </p>
      )}

      {form.fields.map((f) => (
        <Field key={f.name} f={f} uid={uid} value={values[f.name]} error={errors[f.name]} onChange={(v) => set(f.name, v)} />
      ))}

      {/* Honeypot: off-screen rather than display:none, since some bots skip what's obviously hidden. */}
      <div className="gw-honeypot" aria-hidden="true">
        <label htmlFor={`${uid}-hp`}>Website URL</label>
        <input id={`${uid}-hp`} name="website_url" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {status === "failed" && (
        <div className="gw-alert" role="alert">
          <strong>That didn't send.</strong>
          <span>{failure}</span>
          <span>Nothing you've typed is lost. Send it by email instead and everything on this form comes with it:</span>
          <div>
            <Button href={mailtoFallback(form, values)} variant="secondary" size="sm">
              Email it to us instead
            </Button>
          </div>
        </div>
      )}

      <div className="gw-form__foot">
        <div className="gw-actions">
          <Button type="submit" variant="primary" size="lg" arrow disabled={status === "sending"}>
            {status === "sending" ? "Sending…" : form.submitLabel}
          </Button>
        </div>
        <p className="gw-form__fine">
          Sent to Goodwork only. We reply from a person. See the <a className="gw-link" href="/legal/privacy">privacy policy</a>.
        </p>
      </div>
    </form>
  );
}

function Field({ f, uid, value, error, onChange }) {
  const id = `${uid}-${f.name}`;
  const errId = `${id}-error`;
  const hintId = f.hint ? `${id}-hint` : undefined;
  const describedBy = [error ? errId : null, hintId].filter(Boolean).join(" ") || undefined;
  const common = {
    id,
    name: f.name,
    "aria-invalid": error ? "true" : undefined,
    "aria-describedby": describedBy,
    "aria-required": f.required || undefined,
  };

  const label = (
    <label className="gw-field__label" htmlFor={id}>
      {f.label}
      {f.required && (
        <span className="gw-field__req" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
  const hint = f.hint && (
    <span className="gw-field__hint" id={hintId}>
      {f.hint}
    </span>
  );
  const err = error && (
    <span className="gw-field__error" id={errId} role="alert">
      {error}
    </span>
  );

  if (f.type === "textarea") {
    return (
      <div className="gw-field">
        {label}
        {hint}
        <textarea className="gw-textarea" rows={f.rows || 4} value={value} onChange={(e) => onChange(e.target.value)} {...common} />
        {err}
      </div>
    );
  }

  if (f.type === "select") {
    return (
      <div className="gw-field">
        {label}
        {hint}
        <select className="gw-select" value={value} onChange={(e) => onChange(e.target.value)} {...common}>
          <option value="">Choose one</option>
          {f.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {err}
      </div>
    );
  }

  if (f.type === "radio" || f.type === "checkbox-group") {
    const multi = f.type === "checkbox-group";
    const selected = new Set(multi ? value : [value]);
    return (
      <fieldset className="gw-field" aria-describedby={describedBy} aria-invalid={error ? "true" : undefined}>
        <legend className="gw-field__label">
          {f.label}
          {f.required && (
            <span className="gw-field__req" aria-hidden="true">
              *
            </span>
          )}
        </legend>
        {hint}
        <div className={`gw-choices${f.options.length > 3 ? " gw-choices--grid" : ""}`}>
          {f.options.map((o) => (
            <label key={o.value} className="gw-choice">
              <input
                type={multi ? "checkbox" : "radio"}
                name={f.name}
                value={o.value}
                checked={selected.has(o.value)}
                onChange={() => {
                  if (!multi) return onChange(o.value);
                  const next = new Set(value);
                  if (next.has(o.value)) next.delete(o.value);
                  else next.add(o.value);
                  onChange([...next]);
                }}
              />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
        {err}
      </fieldset>
    );
  }

  if (f.type === "checkbox") {
    return (
      <div className="gw-field">
        <label className="gw-choice gw-choice--single" htmlFor={id}>
          <input id={id} name={f.name} type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} aria-invalid={error ? "true" : undefined} aria-describedby={error ? errId : undefined} />
          <span>{f.label}</span>
        </label>
        {err}
      </div>
    );
  }

  const inputMode = f.type === "tel" ? "tel" : f.type === "email" ? "email" : f.type === "url" ? "url" : undefined;
  return (
    <div className="gw-field">
      {label}
      {hint}
      <input
        className="gw-input"
        type={f.type === "url" ? "text" : f.type}
        inputMode={inputMode}
        autoComplete={f.autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...common}
      />
      {err}
    </div>
  );
}
