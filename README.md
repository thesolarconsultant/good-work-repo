# Goodwork

The Goodwork website: a digital product studio and commercial system builder.
Goodwork Products (Library £280, Studio £888) on one side; Goodwork Services
(Built by Goodwork £2,800, Embedded CRM £1,888, the Agency programme
£8,888.88, optional managed infrastructure from £28 per month) on the other.

React 19 + Vite, no UI framework, no animation library, Web-standard edge
functions in `api/`.

```bash
npm install
npm run dev        # dev server
npm run check      # lint + production build (runs the prebuild pipeline)
npm run test:api     # call the edge functions directly: validation, delivery, Stripe signatures
npm run test:routes  # after a build: crawl every route at 390/768/1440 with Chromium
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build. Runs `library`, `images`, `sitemap` and `prices` first |
| `npm run preview` | Serve the built site |
| `npm run lint` | Oxlint |
| `npm run library` | Regenerate the Library catalogue from `library-src/components.txt` |
| `npm run library:bundle` | Build the customer bundle (zip + offline gallery) to `dist-library/`; identical to what `/api/download` serves |
| `npm run images` | Regenerate responsive image derivatives — run after adding a screenshot |
| `npm run sitemap` | Regenerate `public/sitemap.xml` and `public/robots.txt` |
| `npm run prices` | Fail the build if `api/checkout.js` disagrees with `src/data/offers.js` |
| `npm run og` | Regenerate `public/og.png`, the social share card |
| `npm run test:api` | Runs `api/enquiry.js`, `api/checkout.js`, `api/stripe-webhook.js`, `api/access.js` and `api/download.js` in Node against a local webhook sink: 26 checks |
| `npm run test:routes` | Playwright crawl of the built site: console errors, overflow, broken links, menus, filters, previews, form failure states, the sign-in form, the signed-in dashboard and item pages |
| `npm run brand:*`, `logo`, `merch`, `portrait` | Brand asset generators, unchanged from before the rebuild |

## Where things live

```
src/
  data/offers.js        THE single source of truth: every price, inclusion,
                        exclusion, CTA, managed plan, comparison row, licence
                        principle and FAQ answer. Nothing else carries a figure.
  data/nav.js           Header, dropdowns, footer, announcement
  data/forms.js         The five enquiry/application schemas
  data/library.js       Catalogue + templates + Studio systems, filters, related
  data/libraryCatalogue.json   Generated from library-src/components.txt
  data/systems.js       The Studio system pages
  data/showcase.js      Real projects (built on data/caseStudies.js)
  data/learn.js, docs.js, legal.js, founder.js
  lib/                  format (GBP), schema (JSON-LD), analytics (provider-agnostic
                        intent events), auth (session store), forms (validation)
  components/           Nav, Footer, EnquiryForm, BuyButton, Library*, OfferLadder,
                        ComparisonTable, ManagedPlans, SystemJourney, HeroStack …
  pages/                One file per route
  styles.css            Design system: dark foundation, warm off-white, one accent
  styles/motion.css     Everything that moves, and the reduced-motion off switch
api/
  enquiry.js            All forms → webhook and/or Resend (503 until configured)
  checkout.js           Stripe Checkout Session (503 until configured)
  stripe-webhook.js     Signature-verified; emits entitlement.granted
  access.js             Sign in with an access key: GET session, POST sign-in, DELETE sign-out
  download.js           The Library bundle, zipped in memory after the key check
  accept.js, console.js, console-image.js, broll.js   Unchanged client tooling
library-src/            Component source of truth (moved out of public/)
server/                 Shared by api/ and scripts: access keys, the bundle builder,
                        generated/ (the catalogue with code, committed)
public/library/items/   One JSON per component, fetched lazily for previews
public/goodwork/        Client brand deliverables and the engine (starter, motion)
docs/BACKEND.md         How access and downloads work, the interim key store, what retires it
```

## Routes

`/`, `/library`, `/library/:slug`, `/studio`, `/systems`, `/systems/:slug`,
`/services`, `/built-by-goodwork`, `/crm`, `/agency`, `/managed`, `/pricing`,
`/showcase`, `/learn`, `/learn/category/:category`, `/learn/:slug`,
`/docs/:slug`, `/login`, `/dashboard`, `/contact`, `/legal/:slug`, `/pitch`.
Old routes `/work`, `/case-studies` and `/content-console` redirect.

## What is live, what needs credentials, what is deliberately configurable

**Fully functional with no configuration**

- Every public page, the Library with live sandboxed previews, filters and
  search, the pricing comparison, the offer pages, showcase, learn, docs,
  legal drafts, 404, error boundary, mobile navigation and dropdowns.
- Structured data (Organization, WebSite, Product/Service + Offer, FAQPage,
  BreadcrumbList, Article, ItemList), canonical URLs, Open Graph, sitemap,
  robots, security headers (`vercel.json` and `public/_headers`).
- Analytics intent events (`page_view`, `library_preview`, `library_detail`,
  `library_filter`, `pricing_view`, `checkout_start`, `checkout_unavailable`,
  `service_enquiry_start/submit`, `agency_application_submit`,
  `contact_submit`, `access_interest`, `sign_in`, `download`, `library_copy`)
  pushed to `window.dataLayer`, to
  `window.gwAnalytics.track` if defined, and as a `gw:track` DOM event. No
  provider is loaded until one is approved.

**Works once credentials are set (see `.env.example`)**

- Enquiry and application forms: `ENQUIRY_WEBHOOK_URL` and/or
  `RESEND_API_KEY` + `ENQUIRY_TO` + `ENQUIRY_FROM`. Until then the endpoint
  returns 503 and every form shows an honest error with a mailto carrying the
  whole submission. Tested: the crawler drives the contact form into that
  state and checks the message.
- Direct purchase of Library and Studio: `STRIPE_SECRET_KEY`,
  `STRIPE_PRICE_LIBRARY`, `STRIPE_PRICE_STUDIO`, `STRIPE_WEBHOOK_SECRET`, and
  a Stripe webhook endpoint pointed at `/api/stripe-webhook`. Until then buy
  buttons show "checkout isn't switched on yet" and take an email. The
  checkout call has not been exercised against a live Stripe account in this
  repository; the webhook's signature verification is Stripe's documented
  scheme implemented with Web Crypto.
- Customer sign-in and the licensed download: `ACCESS_KEYS`, one
  `library:<key>` or `studio:<key>` entry per purchase (generate a key with
  the command in `.env.example`). Until then `/login` says access isn't
  switched on yet and `/api/download` answers 503. Tested end to end: the API
  harness signs in, downloads and validates the zip; the crawler drives the
  sign-in form and the signed-in dashboard and item pages against a mocked
  session.
- The Content Console demo pages under `/goodwork/brands/` and the live
  B-roll panel: `DEEPSEEK_API_KEY`, `HIGGSFIELD_API_KEY`, `HF_CREDENTIALS`.

**Deliberately not built yet, and said so on the site**

- A database behind customer access. Sign-in, the dashboard and the licensed
  download are real (above), but entitlements live in the `ACCESS_KEYS`
  variable and keys are issued by hand from verified payments.
  `docs/BACKEND.md` says exactly what retires that.
- VAT wording. Prices are shown without any VAT statement until the business
  confirms its treatment.
- Legal wording. Every legal page is a draft written to the commercial
  principles in `data/offers.js`, marked for solicitor review on the page and
  set `noindex` while marked.

## Things the owner should decide

1. **Library originality review.** The catalogue names mirror well-known
   open-source UI libraries. The snippets are vanilla implementations kept
   from the previous repository, not copied React source, but the brief asks
   that released assets be original or correctly licensed. Review before the
   paid release.
2. **Preview exposure.** Live previews necessarily send each snippet to the
   browser (see `docs/BACKEND.md`). Acceptable for a UI gallery; if not
   acceptable, pre-render previews at build time.
3. **The motion runtime** (`public/goodwork/motion/`) and the paste-and-go
   starter (`public/goodwork/index.html`) remain public because the docs and
   the starter template link to them. Decide whether they stay free.
4. **Planned templates** are labelled "Coming soon" in the Library. Replace
   them with real builds or remove them before launch.
5. **Founder video.** Set `video` in `src/data/founder.js` and the section
   switches from the photograph to the film.
6. **Issue the first access keys.** Set `ACCESS_KEYS` (see `.env.example`)
   and redeploy. Your own key gives you the whole Library from the site;
   each buyer gets one from their verified payment until the database exists.

## Content

Change what the site *says* in `src/data/`. A price changes in exactly one
place (`offers.js`) and the homepage, offer pages, pricing table, FAQ, pitch
deck, structured data and the checkout guard all follow; `npm run prices`
fails the build if the Stripe map drifts.

The Library catalogue is generated. Add a component to
`library-src/components.txt` and run `npm run library`; map it to a browsing
category in `scripts/build-library-catalogue.mjs` if the default mapping is
wrong.

## Motion and accessibility

No animation dependency. `src/lib/motion.js` provides `useInView` (with a
safety net so content can never stay hidden if an observer callback is
delayed), `usePrefersReducedMotion` and `useScrollDirection`. All animation
is transform and opacity, and the block at the bottom of `styles/motion.css`
switches it off under `prefers-reduced-motion`. Every page has a skip link,
visible focus states, labelled controls, accessible errors and native
`<details>` FAQs.

## Hosting

Single-page app on `BrowserRouter`; the SPA fallback is required.
`vercel.json` rewrites everything except `/api/`, `/goodwork/` and
`/library/items/` to `index.html` and sets the security headers.
`public/_redirects` and `public/_headers` do the same on Netlify/Cloudflare.
API functions are Web-standard `Request -> Response` handlers declared for
Vercel's edge runtime.

`SITE_URL` (`src/lib/site.js`, overridable with `VITE_SITE_URL`) drives
canonicals, the sitemap, robots and the share image. Change the domain, set
the variable, re-run `npm run sitemap` and `npm run og`, commit the result.
