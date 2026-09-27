# Backend work still required

The public site is complete and honest about what is not yet live. This page
is the precise list of what has to exist before customers can buy online, sign
in and download, and how the pieces already in the repository hand over to it.

Nothing in the front end pretends any of this is done: the buy buttons say
"checkout isn't switched on yet" until Stripe is configured, `/login` explains
that accounts open with the Library release, and `/dashboard` redirects to
sign-in because there is no server-issued session to trust.

## The intended flow

1. Visitor chooses Library (£280) or Studio (£888) and reads the licence and
   exclusions, which sit on the page above every buy button.
2. Visitor completes secure payment — `api/checkout.js` creates a Stripe
   Checkout Session server-side and redirects the browser to it.
3. Stripe posts `checkout.session.completed` to `api/stripe-webhook.js`, which
   verifies the signature and emits a normalised `entitlement.granted` event.
4. **An entitlement store records it.** ← does not exist yet.
5. Customer creates or accesses an account. ← does not exist yet.
6. Dashboard shows only the products covered by the entitlement.
7. Downloads are authorised server-side and served through expiring, signed
   links. ← does not exist yet.
8. Download activity is logged for security and support.

Steps 1–3 are implemented and testable today. Steps 4–8 need a database, an
auth provider and object storage, all of which are decisions with a cost.

## What exists now

| Piece | File | Status |
| --- | --- | --- |
| Checkout session creation | `api/checkout.js` | Implemented. Returns 503 without `STRIPE_SECRET_KEY` and the price ids. Amounts are cross-checked against `src/data/offers.js` by `scripts/check-prices.mjs` on every build. |
| Signed webhook | `api/stripe-webhook.js` | Implemented. HMAC verification with Web Crypto (edge-safe). On a paid session it delivers an `entitlement.granted` event to `ENTITLEMENT_WEBHOOK_URL` (falls back to the enquiry webhook / email). |
| Enquiries and applications | `api/enquiry.js` | Implemented. Five form schemas validated server-side; webhook and/or Resend delivery; 503 when unconfigured. |
| Session interface | `src/lib/auth.js` | Contract only. `useSession()` always returns `unauthenticated`. |
| Dashboard | `src/pages/Dashboard.jsx` | Written against the contract; redirects to `/login` until a session exists. |
| Buy buttons | `src/components/BuyButton.jsx` | Implemented, with the honest 503 state and an access-interest form. |

## The `entitlement.granted` event

This is the contract between the payment layer and whatever stores access.

```json
{
  "type": "entitlement.granted",
  "productId": "library",
  "email": "customer@example.com",
  "name": "Customer Name",
  "customerId": "cus_…",
  "sessionId": "cs_…",
  "paymentIntentId": "pi_…",
  "amountTotal": 28000,
  "currency": "gbp",
  "paidAt": "2026-09-27T00:00:00.000Z",
  "termsAccepted": true,
  "eventId": "evt_…"
}
```

`eventId` is the idempotency key: Stripe retries on any non-2xx, so a store
must treat a repeated `eventId` as already processed.

Until a store exists, the event reaches the inbox or CRM as a verified paid
notification and access is issued by hand. That is a workable interim
process, and it is stated as such in the docs and login pages.

## Suggested data model

- **users** — id, email, name, created_at, last_sign_in_at
- **products** — id (`library`, `studio`), name, price_pence, updates_months
- **product_versions** — id, product_id, version, released_at, changelog
- **assets** — id, product_version_id, filename, storage_key, bytes, sha256
- **purchases** — id, user_id (nullable until claimed), product_id,
  stripe_session_id (unique), stripe_payment_intent_id, stripe_customer_id,
  email, amount_pence, currency, paid_at, stripe_event_id (unique)
- **entitlements** — id, user_id, product_id, granted_at, updates_until,
  revoked_at, reason
- **licence_acceptances** — id, user_id, product_id, licence_version,
  accepted_at, ip, user_agent
- **download_events** — id, user_id, asset_id, issued_at, expires_at,
  ip, user_agent, completed
- **enquiries** — id, form, fields (json), text, page, received_at, status
- **managed_plans** — id, user_id, plan_id, started_at, ended_at,
  fair_use_notes
- **support_requests** — id, user_id, subject, body, status, created_at

## Security rules that must hold

- Paid source files are never served from `public/` or any guessable URL.
  Store them in private object storage and issue short-lived signed URLs
  (or stream through a function) only after checking `entitlements`.
- Entitlements are created only from a verified webhook, never from the
  success redirect, and never from anything the browser sends.
- Sessions are server-issued (httpOnly cookie or provider session). Nothing in
  the UI reads a token from `localStorage` or trusts a query parameter.
- Download issuance is logged. Credential sharing and redistribution are
  grounds for suspension under the acceptable-use page.
- Environment variables only; no secret carries a `VITE_` prefix.

## What the live previews expose, deliberately

The Library's live previews render each component's snippet inside a
sandboxed `srcdoc` iframe. That means the preview code for the 166 catalogue
components is fetched by the browser from `/library/items/<id>.json`, exactly
as the previous public gallery already did. It cannot reach the parent page
(`sandbox="allow-scripts"`, no `allow-same-origin`), but it is visible to
anyone who opens devtools, as any live UI gallery is.

The paid product is the curated, documented bundle (templates, the Studio
systems, guides, updates and the licence), which is not in `public/` and will
be delivered through the flow above. If the business wants zero exposure of
snippet source, the alternative is pre-rendered video or image previews
generated at build time; that is a follow-up, not a blocker.

The raw source of truth (`library-src/components.txt`) was moved out of
`public/` so it is no longer served, and the old public gallery page with its
"copy everything" button was removed.

## Provider suggestions (not decided)

- Auth: Clerk, Auth.js, Supabase Auth or Lucia — any that issues a server
  session. Wire it in `src/lib/auth.js` and gate `api/download.js` with it.
- Database: Postgres (Neon, Supabase) or Vercel Postgres.
- Storage: Cloudflare R2 or S3 with signed URLs; keep bundles private.
- Email: Resend is already used for enquiries.

## Order of work

1. Add the database and the `purchases` / `entitlements` tables; point
   `ENTITLEMENT_WEBHOOK_URL` at a new `api/entitlements.js` that writes them
   idempotently by `eventId`.
2. Add the auth provider; implement `useSession()` and a magic-link or
   provider sign-in on `/login`; flip `AUTH_ENABLED`.
3. Add private storage and `api/download.js` that checks the entitlement,
   logs a `download_event` and returns a signed URL valid for minutes.
4. Wire the dashboard's "Request download link" button to it.
5. Add the licence-acceptance record at checkout (Stripe's consent field is
   already captured on the session) and at first download.
