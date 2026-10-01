# Beauty Heaven CRM — Twenty (self-hosted)

Beauty Heaven's **own** Twenty instance, separate from Good Work's. It holds the
**leads** the website and the assistant pick up — the things Phorest doesn't do.
Phorest stays the system of record for clients and bookings; the CRM never
duplicates them, and **nothing clinical** goes in it.

- **Captures:** academy course enquiries, model-opportunity interest, general
  treatment enquiries, and bot conversations that don't become a booking.
- **Code:** `sites/beauty-heaven-hub/api/_crm.js` already written — it posts a
  Lead to this instance. It no-ops safely until the two env vars below are set,
  and never breaks a booking or a reply if the CRM is down.

---

## 1. Stand up the instance (in Beauty Heaven's name, not Good Work's)

Self-host with Docker, the same way as the Good Work one, on a small box
(VPS / Railway / Fly) under a Beauty Heaven subdomain, e.g.
`crm.beautyheavenhub.co`. Follow the official self-host guide
(twenty.com → Developers → Self-hosting) for the current compose file and
version — don't copy an old one, it moves fast.

Keep it the client's: their domain, their box, their logins. Good Work gets a
member seat, not ownership.

## 2. Create the Lead object

In the instance: **Settings → Data model → New object**
- Singular: `Lead`, Plural: `Leads` (this gives the REST path `leads`).

Then add these fields (names matter — the code uses them exactly):

| Field (API name) | Type | Notes |
|---|---|---|
| `name` | Text | Person's name |
| `email` | Text | Kept as plain text, not the composite Emails type, so the API stays simple |
| `phone` | Text | Same reason |
| `source` | Select | Options, lowercase: `academy`, `model`, `treatment`, `bot` |
| `subject` | Text | The course or treatment it's about |
| `message` | Text | What they said |
| `consent` | Boolean | Did they tick the consent box |
| `channel` | Text | Where it came in: `website`, `telegram`, `whatsapp` |

(If you'd rather use a different object path, set `TWENTY_LEADS_PATH` to match.)

## 3. Generate an API key

**Settings → APIs → Create key.** Copy it once — you won't see it again.

## 4. Wire it into Vercel (project `beauty-heaven-hub`, Sensitive)

| Key | Value |
|---|---|
| `TWENTY_API_URL` | `https://crm.beautyheavenhub.co` (no trailing `/rest`) |
| `TWENTY_API_KEY` | the key from step 3 — **Sensitive** |
| `TWENTY_LEADS_PATH` | only if the object path isn't `leads` |

Then tell me and I'll redeploy and run a read-only check (`crmStatus()`), which
reports `ok` or exactly what's missing, without reading any records.

---

## Data protection — before the forms go live

A CRM full of names, emails and phones is personal data. Before the capture
forms are switched on:
- Each form needs a **consent line** and a link to the **privacy notice**.
- The **privacy notice** must exist (it's currently a to-confirm on the site),
  and the **data agreement** between Good Work and the salon should be in place.
- Consent state is stored on every lead (`consent`), and consultation/medical
  detail never goes into the CRM.

## Build status

- [x] `api/_crm.js` — lead-create client, env-gated, resilient.
- [ ] Capture forms on the site (academy enquiry, model interest, general
      enquiry) — built **after** the privacy/consent wording is agreed.
- [ ] Bot hand-over → lead hook (backend, same gate).
- [ ] Instance stood up + env vars set + connection check green.
