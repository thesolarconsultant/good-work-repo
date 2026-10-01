# Backend: what exists, what is interim, what is still to build

The public site is complete and honest about what is not yet live. This page
is the precise list of how purchase, access and download work, what has to be
set up for them to run, and what a database would add later.

## The flow as it works today

1. Visitor chooses Library (£280) or Studio (£888) and reads the licence and
   exclusions, which sit on the page above every buy button.
2. `api/checkout.js` creates a Stripe Checkout Session server-side and sends
   the browser to it. The amount comes from `server/products.js`, never from
   the browser. The first time a product is bought, checkout finds its Stripe
   Price by lookup key or creates it, so nothing has to be set up in the
   Stripe catalogue. (503 until `STRIPE_SECRET_KEY` is set; the button says
   so.)
3. On Stripe's page the buyer ticks the licence and refund acknowledgement
   (Stripe's consent collection, recorded on the session) and pays.
4. Stripe returns the buyer to `/welcome?session_id=cs_…`. The page posts the
   id to `api/claim.js`, which asks Stripe for that session and checks it is
   complete, paid, in pounds, at the listed price, for Library or Studio.
   Only then does it issue a **purchase key** and set the session cookie. The
   page shows the key once, with a copy button, and the download works
   straight away.
5. Separately, Stripe posts the paid session to `api/stripe-webhook.js`, which
   verifies the signature and delivers an `entitlement.granted` event,
   carrying the same key, to the owner's webhook or inbox. With Resend set
   up, the buyer is emailed their key too: their copy if they closed the tab.
6. On any other device the buyer signs in at `/login` with the key.
   `api/access.js` checks it and sets an HttpOnly, Secure, SameSite=Strict
   cookie scoped to `/api`. Nothing is decided in the browser:
   `src/lib/auth.js` asks the server and renders the answer.
7. `/dashboard` lists only what the key covers, as returned by the server.
8. `api/download.js` checks the key again on every request and streams the
   Library bundle, built in memory from `server/generated/libraryItems.js` by
   the same code that builds the hand-over zip. The paid files are never in
   `public/` or at a guessable URL.
9. Each claim, sign-in and download is written to the function log with the
   key's id, never the key.

All of it is implemented and tested: `npm run test:api` runs checkout, claim
and the webhook against a stubbed Stripe, and `npm run test:routes` drives
the welcome page, the sign-in form and the signed-in pages. None of it has
been run against a live Stripe account from this repository, so make one
test-mode purchase first (below).

## Keys without a database

`server/accessKeys.js` is the only code that knows what a key is. It honours
two kinds.

- **Purchase keys** (`gw-lib-<id>-<signature>`, `gw-stu-…`) are issued by
  `api/claim.js` and the webhook. The id is derived from the Checkout
  Session, so a purchase always gives the same key: claiming twice, or the
  welcome page and the webhook both issuing it, never makes a second licence.
  The signature is HMAC-SHA256 under `ACCESS_SIGNING_SECRET`, so a key is
  verified without being stored anywhere. Changing that secret withdraws
  every key already sold, so it is set once and left alone.
- **Hand-issued keys** live in `ACCESS_KEYS`, for sales outside checkout (an
  invoice), comps and the owner's own access.

A Studio key covers the Library too. Anyone holding a paid session's id can
claim its key, which is the usual Stripe model: the id is long and random and
appears only in the buyer's return URL and the Stripe dashboard.

### Refunds and revocation

Add the key's id to `ACCESS_REVOKED` (comma-separated) and redeploy. A
purchase key's id is its third part (`gw-lib-<id>-…`) and arrives with each
sale as `accessKeyId`; a hand-issued key's id is the `keyId` in the sign-in
log. A revoked key is refused at claim, sign-in and download, and a signed-in
session ends on its next request.

### Resending a key

The buyer's key is on the welcome page, in their email (with Resend set up)
and in the owner's sale notification. If none of those reached them: in the
Stripe dashboard, open the payment and find its Checkout Session id
(`cs_live_…`, in the payment's events), then open
`<site>/welcome?session_id=<that id>`. The page shows the same key; send it
to the buyer at the address they paid with. That signs your browser in as the
buyer, so sign out afterwards.

### Issuing a key by hand

```sh
node -e "console.log('gw_'+require('crypto').randomBytes(18).toString('base64url'))"
```

Add `library:<key>:<buyer email>` (or `studio:…`) to `ACCESS_KEYS` in the
hosting platform's environment settings, redeploy, and send the key. The
label after the second colon is optional and is shown back to that key
holder only.

## Setting it up

In Stripe, once:

1. **Terms URL.** Settings → Business → Public details: set the terms of
   service URL to `<site>/legal/terms` (the privacy policy URL,
   `<site>/legal/privacy`, is optional). Checkout asks for the licence tick,
   and Stripe won't show that tick without a terms URL: until it's set,
   checkout answers "Checkout could not be started" and the function log
   carries Stripe's reason.
2. **Secret key.** Developers → API keys. The secret key goes in the hosting
   platform as `STRIPE_SECRET_KEY`, never in the repository or the browser.
3. **Webhook.** Developers → Webhooks → add an endpoint for
   `<site>/api/stripe-webhook` with the events `checkout.session.completed`
   and `checkout.session.async_payment_succeeded`. Its signing secret goes in
   `STRIPE_WEBHOOK_SECRET`.
4. **Receipts.** Settings → Customer emails: turn on receipts for successful
   payments.

In the hosting platform:

5. `ACCESS_SIGNING_SECRET`: 32+ random characters (the command is in
   `.env.example`), set once.
6. Optional but recommended: `RESEND_API_KEY` with `ACCESS_EMAIL_FROM` (or
   `ENQUIRY_FROM`) so buyers get their key by email, and
   `ENTITLEMENT_WEBHOOK_URL` or the `ENQUIRY_*` email route so the owner hears
   about each sale.
7. Redeploy. On Vercel, environment variables reach the functions only from
   the next deployment.

Do it in test mode first. Put an `sk_test_…` key and a separate
`ACCESS_SIGNING_SECRET` on the Preview environment only, open a preview
deployment and buy with the card `4242 4242 4242 4242`, any future expiry and
any CVC. Check the welcome page shows a key and the download works. The
webhook isn't needed for that, and on Vercel, Stripe can't reach previews
behind deployment protection anyway; its first live delivery shows under the
endpoint in Stripe. Then set the live key and the live webhook on Production.
A separate preview secret means a test purchase's key never works on the
live site.

## Selling the services

Built by Goodwork, Embedded CRM and the Agency programme are scoped before
anyone pays, so the site has no buy button for them. Take payment with a
Stripe Payment Link or an invoice once the scope is agreed. The webhook
acknowledges those payments and ignores them, because they carry no
`metadata.product`, so a service payment never issues a Library key. To
include the Library with a service, issue that key by hand.

## What exists now

| Piece | File | Status |
| --- | --- | --- |
| Products and prices | `server/products.js` | The amounts checkout charges and claim checks, in pence. `scripts/check-prices.mjs` fails the build if they disagree with `src/data/offers.js`. |
| Checkout | `api/checkout.js` | Implemented. Finds or creates the Stripe price by lookup key (or uses `STRIPE_PRICE_*`), creates the session with consent collection, returns to `/welcome`. 503 without `STRIPE_SECRET_KEY`; 502, "nothing has been charged", on any Stripe error. |
| Claim | `api/claim.js` | Implemented. Verifies the session with Stripe (complete, paid, GBP, listed amount, known product), issues the purchase key, signs the buyer in. 409 while a payment is still clearing; 503 without `STRIPE_SECRET_KEY` and `ACCESS_SIGNING_SECRET`. |
| Signed webhook | `api/stripe-webhook.js` | Implemented. HMAC verification with Web Crypto (edge-safe). On a paid Library or Studio session it delivers `entitlement.granted`, with the key, to `ENTITLEMENT_WEBHOOK_URL` (falls back to the enquiry webhook / email) and emails the buyer their key when Resend is set up. Anything else on the account is acknowledged and ignored. |
| Enquiries and applications | `api/enquiry.js` | Implemented. Five form schemas validated server-side; webhook and/or Resend delivery; 503 when unconfigured. |
| Access keys | `server/accessKeys.js` | Implemented. Issues and verifies purchase keys, parses `ACCESS_KEYS`, honours `ACCESS_REVOKED`, compares in constant time, issues and clears the cookies. |
| Sign-in endpoint | `api/access.js` | Implemented. GET (session), POST (sign in), DELETE (sign out). 503 until `ACCESS_SIGNING_SECRET` or `ACCESS_KEYS` is set. |
| Licensed download | `api/download.js` | Implemented. 401 without a valid key; zips the bundle in memory; logs by key id. |
| The bundle | `server/libraryBundle.js`, `scripts/build-library-bundle.mjs` | Implemented. One definition of the deliverable, used by the download endpoint and by `npm run library:bundle`. |
| Session store | `src/lib/auth.js` | Implemented against `api/access.js`. Ordinary visitors never call the server (a marker cookie gates it). |
| Welcome page | `src/pages/Welcome.jsx` | Implemented. Claims the purchase, shows the key with a copy button and the download; says plainly when a payment is still clearing, when automatic access isn't switched on, or when a reference doesn't check out. `noindex`, and disallowed in robots. |
| Sign-in page | `src/pages/Login.jsx` | Implemented. Shows the key form when the server takes keys, and an honest "not switched on yet" notice with an interest form when it answers 503. A legacy `?session_id=` return is forwarded to `/welcome`. |
| Dashboard | `src/pages/Dashboard.jsx` | Implemented. Renders the server's answer; download links go back through `api/download.js`. |
| Item pages | `src/pages/LibraryItem.jsx` | Full source with a copy button, and the bundle download, once the server confirms the key covers the item. |
| Buy buttons | `src/components/BuyButton.jsx` | Implemented, with the honest 503 state and an access-interest form. |

## The `entitlement.granted` event

The owner's record of each sale, and the contract with whatever stores
access later.

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
  "eventId": "evt_…",
  "accessKey": "gw-lib-…",
  "accessKeyId": "…"
}
```

`accessKey` and `accessKeyId` are present when `ACCESS_SIGNING_SECRET` is
set. `eventId` is the idempotency key: Stripe retries on any non-2xx, so a
store must treat a repeated `eventId` as already processed. The key itself is
already idempotent, being derived from the session.

## Security rules that hold

- Paid source files are never served from `public/` or any guessable URL. The
  bundle is assembled in the function after the key check; the only public
  copies of snippet code are the sandboxed previews (below).
- Access is granted only from a payment Stripe confirms: `api/claim.js` asks
  Stripe for the session itself, and the webhook verifies Stripe's
  signature. The `session_id` in the return URL is a reference to look up,
  never proof, and nothing the browser sends decides a product or a price.
- Sessions are server-issued: an HttpOnly cookie the page cannot read. Nothing
  in the UI reads a token from `localStorage`. The only client-visible cookie
  is a marker with no secret in it.
- Keys are compared in constant time. The only response that contains a key
  is the buyer's own, once, from `api/claim.js` after Stripe confirms the
  payment.
- Claims, sign-ins and downloads are logged by key id. Credential sharing and
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

## What a database would add

Keys work without one. A database would make these better:

1. Revocation without a redeploy: an `entitlements` row update instead of
   `ACCESS_REVOKED`. `authorise()` in `server/accessKeys.js` is the only
   function that changes; keep the constant-time comparison and record
   `last_used_at`.
2. Self-service key recovery: the buyer enters the email they paid with and
   receives a sign-in link, instead of the owner resending a key.
3. `download_events` written from `api/download.js` instead of the function
   log.
4. The Studio systems in the bundle builder as they ship, with
   `product_versions` and a changelog, so the dashboard shows what changed.
5. The licence acceptance stored with the purchase (Stripe already records
   the consent tick on the session) and at first download.
