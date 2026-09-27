# Backend: what exists, what is interim, what is still to build

The public site is complete and honest about what is not yet live. This page
is the precise list of how purchase, access and download work today, which
part of that is an interim mechanism, and what has to exist before it can be
retired.

## The flow as it works today

1. Visitor chooses Library (£280) or Studio (£888) and reads the licence and
   exclusions, which sit on the page above every buy button.
2. Visitor completes secure payment — `api/checkout.js` creates a Stripe
   Checkout Session server-side and redirects the browser to it. (503 until
   the Stripe variables are set; the button says so.)
3. Stripe posts `checkout.session.completed` to `api/stripe-webhook.js`, which
   verifies the signature and emits a normalised `entitlement.granted` event
   to a webhook or inbox.
4. **Interim entitlement store.** The owner generates an access key, adds
   `library:<key>` or `studio:<key>` to the `ACCESS_KEYS` environment variable
   and redeploys, then emails the key to the buyer. `server/accessKeys.js`
   is the only code that knows how keys are stored.
5. Customer signs in at `/login` with the key. `api/access.js` checks it in
   constant time and sets an HttpOnly, Secure, SameSite=Strict cookie scoped
   to `/api`. Nothing is decided in the browser: `src/lib/auth.js` asks the
   server and renders the answer.
6. `/dashboard` lists only what the key covers, as returned by the server.
7. `api/download.js` checks the key again on every request and streams the
   Library bundle, built in memory from `server/generated/libraryItems.js` by
   the same code that builds the hand-over zip. The paid files are never in
   `public/` or at a guessable URL.
8. Each issued download and sign-in is written to the function log with the
   key's id (a hash prefix), never the key.

Steps 1–3 and 5–8 are implemented and tested (`npm run test:api`, and the
signed-in scenarios in `npm run test:routes`). Step 4 is manual until there is
a database.

## What exists now

| Piece | File | Status |
| --- | --- | --- |
| Checkout session creation | `api/checkout.js` | Implemented. Returns 503 without `STRIPE_SECRET_KEY` and the price ids. Amounts are cross-checked against `src/data/offers.js` by `scripts/check-prices.mjs` on every build. |
| Signed webhook | `api/stripe-webhook.js` | Implemented. HMAC verification with Web Crypto (edge-safe). On a paid session it delivers an `entitlement.granted` event to `ENTITLEMENT_WEBHOOK_URL` (falls back to the enquiry webhook / email). |
| Enquiries and applications | `api/enquiry.js` | Implemented. Five form schemas validated server-side; webhook and/or Resend delivery; 503 when unconfigured. |
| Access keys | `server/accessKeys.js` | Implemented, interim. Parses `ACCESS_KEYS`, compares in constant time, issues and clears the cookies. Replace `authorise()` with a database lookup and nothing else changes. |
| Sign-in endpoint | `api/access.js` | Implemented. GET (session), POST (sign in), DELETE (sign out). 503 until `ACCESS_KEYS` is set. |
| Licensed download | `api/download.js` | Implemented. 401 without a valid key; zips the bundle in memory; logs by key id. |
| The bundle | `server/libraryBundle.js`, `scripts/build-library-bundle.mjs` | Implemented. One definition of the deliverable, used by the download endpoint and by `npm run library:bundle`. |
| Session store | `src/lib/auth.js` | Implemented against `api/access.js`. Ordinary visitors never call the server (a marker cookie gates it). |
| Sign-in page | `src/pages/Login.jsx` | Implemented. Shows the key form when the server takes keys, and an honest "not switched on yet" notice with an interest form when it answers 503. |
| Dashboard | `src/pages/Dashboard.jsx` | Implemented. Renders the server's answer; download links go back through `api/download.js`. |
| Item pages | `src/pages/LibraryItem.jsx` | Full source with a copy button, and the bundle download, once the server confirms the key covers the item. |
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
notification and the owner issues a key by hand (step 4 above). That is a
workable process for the first customers; it does not scale, and revoking a
key means editing an environment variable and redeploying.

## Issuing a key by hand

```sh
node -e "console.log('gw_'+require('crypto').randomBytes(18).toString('base64url'))"
```

Add `library:<key>:<buyer email>` (or `studio:…`) to `ACCESS_KEYS` in the
hosting platform's environment settings, redeploy, and send the key to the
buyer from the address they paid with. The label after the second colon is
optional and is shown back to that key holder only. A Studio key covers the
Library too.

## Security rules that hold

- Paid source files are never served from `public/` or any guessable URL. The
  bundle is assembled in the function after the key check; the only public
  copies of snippet code are the sandboxed previews (below).
- Entitlements are created only from a verified payment (webhook, or invoice
  confirmed by hand), never from the success redirect, and never from
  anything the browser sends.
- Sessions are server-issued: an HttpOnly cookie the page cannot read. Nothing
  in the UI reads a token from `localStorage` or trusts a query parameter. The
  only client-visible cookie is a marker with no secret in it.
- Keys are compared in constant time and are never included in a response.
- Download and sign-in events are logged by key id. Credential sharing and
  redistribution are grounds for suspension under the acceptable-use page.
- Environment variables only; no secret carries a `VITE_` prefix.

## What the live previews expose, deliberately

The Library's live previews render each component's snippet inside a
sandboxed `srcdoc` iframe. That means the preview code for the 166 catalogue
components is fetched by the browser from `/library/items/<id>.json`, exactly
as the previous public gallery already did. It cannot reach the parent page
(`sandbox="allow-scripts"`, no `allow-same-origin`), but it is visible to
anyone who opens devtools, as any live UI gallery is.

The paid product is the curated bundle: every component as a paste-ready file
organised by category, the offline gallery, `components.json`, the licence,
guidance and updates for twelve months. If the business wants zero exposure of
snippet source, the alternative is pre-rendered video or image previews
generated at build time; that is a follow-up, not a blocker.

The raw source of truth (`library-src/components.txt`) lives outside `public/`
so it is never served, and the old public gallery with its "copy everything"
button was removed.

## Suggested data model (for the permanent store)

- **users** — id, email, name, created_at, last_sign_in_at
- **products** — id (`library`, `studio`), name, price_pence, updates_months
- **product_versions** — id, product_id, version, released_at, changelog
- **assets** — id, product_version_id, filename, storage_key, bytes, sha256
- **purchases** — id, user_id (nullable until claimed), product_id,
  stripe_session_id (unique), stripe_payment_intent_id, stripe_customer_id,
  email, amount_pence, currency, paid_at, stripe_event_id (unique)
- **entitlements** — id, user_id, product_id, granted_at, updates_until,
  revoked_at, reason
- **access_keys** — id, entitlement_id, key_hash, label, created_at,
  last_used_at, revoked_at
- **licence_acceptances** — id, user_id, product_id, licence_version,
  accepted_at, ip, user_agent
- **download_events** — id, user_id, asset_id, issued_at, ip, user_agent
- **enquiries** — id, form, fields (json), text, page, received_at, status
- **managed_plans** — id, user_id, plan_id, started_at, ended_at,
  fair_use_notes
- **support_requests** — id, user_id, subject, body, status, created_at

## Provider suggestions (not decided)

- Database: Postgres (Neon, Supabase) or Vercel Postgres.
- Auth, if magic links replace keys: Clerk, Auth.js, Supabase Auth or Lucia —
  any that issues a server session. The UI already treats the session as the
  server's answer, so `src/lib/auth.js` is the only file that changes.
- Storage, once bundles carry assets too large to assemble per request:
  Cloudflare R2 or S3 with private objects streamed through the function.
- Email: Resend is already used for enquiries.

## Order of work to retire the interim store

1. Add the database with `purchases`, `entitlements` and `access_keys`; point
   `ENTITLEMENT_WEBHOOK_URL` at a new `api/entitlements.js` that writes them
   idempotently by `eventId`, generates a key, stores its hash and emails the
   key to the buyer. Step 4 above stops being manual.
2. Replace `authorise()` in `server/accessKeys.js` with a hash lookup against
   `access_keys` (keep the constant-time comparison; record `last_used_at`).
   Revocation becomes a row update instead of a redeploy.
3. Write `download_events` from `api/download.js` instead of the function log.
4. Add the Studio systems to the bundle builder as they ship, with
   `product_versions` and a changelog, so the dashboard shows what changed.
5. Add the licence-acceptance record at checkout (Stripe's consent field is
   already captured on the session) and at first download.
