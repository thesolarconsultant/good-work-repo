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

Self-host with Docker, on a box under a Beauty Heaven subdomain, e.g.
`crm.beautyheavenhub.co`. Keep it the client's: their box, their domain, their
logins. Good Work gets a member seat, not ownership.

**The one-command installer** (official — pulls the current `docker-compose.yml`
and `.env`, generates the secrets, runs `docker compose up -d`):

```bash
# a NEW folder, separate from the Good Work instance so data never mixes
mkdir beautyheaven-crm && cd beautyheaven-crm
bash <(curl -sL https://raw.githubusercontent.com/twentyhq/twenty/main/packages/twenty-docker/scripts/install.sh)
```

- When it asks for a directory name, give it something like `beautyheaven-crm`.
- If **port 3000 is already taken** (the Good Work instance), pick another, e.g.
  `3001`.
- It writes a `.env` with `ENCRYPTION_KEY`, `PG_DATABASE_PASSWORD`, `TAG` and
  `SERVER_URL` (defaults to `http://localhost:3000`).

**Make it reachable from the website.** The integration needs a public HTTPS
URL, so point `crm.beautyheavenhub.co` at the box, put it behind a reverse proxy
with TLS (Caddy/Nginx/Cloudflare Tunnel), then set in `.env`:

```
SERVER_URL=https://crm.beautyheavenhub.co
```

and `docker compose up -d` again. (For a quick look you can use the box's
IP/port, but the live website integration needs the HTTPS URL.)

Then open it and create the first account — that's the Beauty Heaven workspace.

> **No time for hosting right now?** Twenty Cloud (twenty.com) gives you an
> instance instantly — it's a subscription and the data sits on their cloud, but
> you can start there and move to self-host later. Everything below is identical.

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
