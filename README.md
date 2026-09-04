# GOOD WORK.

The agency site — brand, work, case studies, the Content Console and services.
React 19 + Vite, no UI framework, no animation library.

```bash
npm install
npm run dev
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build (runs `images` and `sitemap` first) |
| `npm run preview` | Serve the built site |
| `npm run preview:file` | One self-contained HTML file in `preview/`, for sending a preview to someone with no server |
| `npm run lint` | Oxlint |
| `npm run images` | Regenerate responsive image derivatives — **run this after adding a screenshot** |
| `npm run logo` | Regenerate the logo artwork in `brand/` for printers, suppliers and socials |
| `npm run og` | Regenerate `public/og.png`, the social share card |
| `npm run sitemap` | Regenerate `public/sitemap.xml` |
| `npm run brand:logo -- <slug>` | Rebuild a client brand's logo artwork from `public/goodwork/brands/<slug>/logo.config.mjs` |
| `npm run brand:photos -- <slug>` | Rebuild a client brand's responsive WebP photography — **run this after adding a photo** |
| `npm run brand:botanicals -- <slug>` | Regenerate a brand's drawn botanicals (olive sprigs, vines) |

## How it's put together

```
src/
  lib/motion.js        Motion primitives — reveals, count-up, parallax, glow, magnetic hover
  lib/site.js          SITE_URL, used for canonicals and structured data
  styles.css           Brand system: colour, type, spacing, components
  styles/motion.css    Everything that moves, plus the reduced-motion off switch
  components/          Reusable pieces (Button, Shot, Reveal, Stamp, Seo, …)
  pages/               One file per route
  data/                Copy and content — services, case studies, console sections
```

Content lives in `src/data/`. Changing what the site *says* rarely means touching
a component.

### Motion

There's no animation dependency. `src/lib/motion.js` provides hooks built on
IntersectionObserver and `requestAnimationFrame`; the animation itself is CSS,
driven by `data-gw-reveal` / `data-gw-visible` attributes. Everything is
transform and opacity only, so it stays on the compositor.

Two rules worth keeping:

1. **Never clip the element you're observing.** An element clipped to zero area
   reports an intersection ratio of 0, so it can never be revealed — it hides
   itself permanently. Clip an inner wrapper instead (see `.gw-shot__frame`).
2. **Everything must survive `prefers-reduced-motion`.** The block at the bottom
   of `styles/motion.css` disables animation; check that content is still
   visible and usable with it on, not just still.

### Images

Source screenshots go in `public/case-studies/` or `public/console/` at full
resolution. `npm run images` generates AVIF and WebP at four widths into
`public/derived/` and writes `src/data/imageManifest.json`, which the `<Shot>`
component reads for `srcset` and intrinsic dimensions.

Always render screenshots through `<Shot>` — that's what keeps a phone pulling
~15kB per image instead of the 2160px original, and what stops the page
jumping around as images arrive.

Derivatives are committed so deploys don't depend on a working `sharp` install.
The first generation takes a few minutes; after that it only touches images
that changed.

### Metadata

`<Seo>` renders per-page title, description, canonical, Open Graph, Twitter and
JSON-LD. React 19 hoists those into `<head>` on its own, so there's no helmet
library.

`index.html` carries a set of site-level fallbacks marked `data-gw-default`, for
scrapers that don't run JavaScript. `<Seo>` removes them once it mounts so
JS-capable crawlers don't see two of everything.

The site URL is in `src/lib/site.js` and can be overridden at build time with
`VITE_SITE_URL`. If the domain changes, update it there and in
`public/robots.txt`, then re-run `npm run sitemap` and `npm run og`.

### Higgsfield — live B-roll

`/content-console` can generate a real clip on demand, using the same brand
style file the page describes. It's the one claim on that page we can
demonstrate rather than assert.

**It is off until you deploy it.** `BrollStudio` asks `/api/broll` for the
preset list on mount; if that 404s (function not deployed) or 503s (no
credentials) it renders nothing, and the page is exactly as it is today.

To turn it on:

1. Set `HF_CREDENTIALS` (`KEY_ID:KEY_SECRET`, from the Higgsfield dashboard)
   and `SITE_URL` in the hosting platform's environment settings. **Never** use
   a `VITE_` prefix — Vite inlines those into the public bundle.
2. Deploy `api/broll.js`. It's a Web-standard handler (`Request` → `Response`),
   so it runs as-is on Netlify Functions v2, Cloudflare Workers and Vercel Edge.
   For a Vercel Node function, wrap it:
   ```js
   import handler from "./broll.js";
   export default async (req, res) => {
     const r = await handler(new Request(`https://${req.headers.host}${req.url}`, {
       method: req.method,
       headers: req.headers,
       body: ["GET", "HEAD"].includes(req.method) ? undefined : JSON.stringify(req.body),
     }));
     res.status(r.status).json(await r.json());
   };
   ```
3. Replace the `seedImage` on each preset in `api/broll.js` with real client
   stills. They currently point at site screenshots, which animate badly —
   they're there so the wiring can be tested, not so it looks good.

Two things worth knowing before it goes live:

- **Every click costs money.** A public endpoint that generates video is a free
  video generator for anyone who finds it, billed to you. The function only
  accepts a preset id — never arbitrary prompt text — and throttles per IP, but
  that throttle is per-instance memory and won't survive cold starts or span
  concurrent instances. **Set a hard spend cap on the Higgsfield account.** That
  is the control that actually protects the bill; the code is defence in depth.
- Higgsfield fetches the seed image itself, so it needs a public absolute URL.
  The panel cannot work against localhost.

Prompts live server-side in `api/broll.js`, including `BRAND_STYLE`, which is
prepended to every preset. Retune that constant and every clip changes with it.

### Hosting — the SPA fallback is not optional

This is a single-page app on `BrowserRouter`, so `/services` is a route the
JavaScript invents, not a file on disk. The build produces exactly one HTML
file. Clicking around works because React Router handles it in the browser; a
hard refresh or a pasted link asks the *host* for `/services`, finds nothing,
and returns the host's own 404. Every page except `/` breaks, and only on
refresh — which is why it survives casual testing and why `vite preview` never
shows it (it has the fallback built in).

Two files fix it, and both are committed:

- `vercel.json` — rewrites everything except `/api/...` to `/index.html`.
- `public/_redirects` — the Netlify/Cloudflare Pages equivalent, so moving
  host doesn't silently reintroduce it.

If you move to a host that uses neither, configure the same fallback there
before shipping.

The API functions are Web-standard `Request -> Response` handlers, which is
Vercel's Edge runtime rather than its Node one, so both declare
`export const config = { runtime: "edge" }`. Netlify Functions v2 and
Cloudflare Workers ignore that and take them as they are.

### The domain

`SITE_URL` (`src/lib/site.js`) is what canonical tags, the sitemap, `robots.txt`,
the OG image URL and the schema are all built from. It defaults to
`https://goodwork.agency`. **Set `VITE_SITE_URL` in the host's environment
settings to whatever the site actually serves from**, then re-run
`npm run sitemap` and `npm run og` and commit the result — a canonical tag
pointing at a domain you don't serve tells Google the real page lives
somewhere else.

`robots.txt` is generated by `scripts/build-sitemap.mjs` rather than hand-kept,
so its `Sitemap:` line cannot drift from that value.

### The scope builder — /services

`src/components/ScopeBuilder.jsx` is the interactive route through the
services: six questions, then a recommendation the client can edit, then their
details, then a review of the whole thing, then it sends.

The order of steps lives in one `FLOW` array at the top of the component —
progress, next, back and the review screen's "change this" links are all
derived from it, so adding or reordering a step is a single edit.

Three files, deliberately separate:

- `src/data/scope.js` — the questions, and the rules that map answers to
  services. **This is the file to edit** when the offer or the pitch changes;
  it is copy and commercial judgement, not code. Every `services: [...]` entry
  is a real id from `data/services.js`, and `validateScope()` proves it — a
  typo logs an error in dev rather than silently creating a service that can
  never be recommended.
- `src/lib/enquiry.js` — turns a finished scope into the plain-text summary
  that lands in the inbox, and builds the mailto fallback.
- `api/enquiry.js` — delivery.

**It sends nothing until you configure it.** Set at least one of:

- `ENQUIRY_WEBHOOK_URL` — POSTs the enquiry as JSON. Use this for a CRM
  (GoHighLevel, Zapier, Make, n8n, your own endpoint). The body is flat at the
  top level — `name`, `firstName`, `lastName`, `email`, `phone`, `companyName`,
  `message`, `tags`, `services`, `serviceIds`, `serviceCount` — so a CRM can
  map it onto a contact record without a transform step. `tags` arrives ready
  to drop on the record (`website-enquiry`, `scope-builder`, and one
  `service:<id>` per thing they picked). The nested `contact`, `answers` and
  the rendered `text` summary are all there too. `ENQUIRY_WEBHOOK_TOKEN` is
  optional and sent as both `Authorization: Bearer` and `X-Webhook-Token`.
- `RESEND_API_KEY` with `ENQUIRY_TO` and `ENQUIRY_FROM` — sends it as email.
  `ENQUIRY_FROM` must be on a domain verified in Resend.

Set both and it does both, and only fails if both fail — a working inbox
shouldn't be undone by a CRM being down.

With neither set the endpoint returns 503, and the builder shows the client an
error plus an email link carrying their whole scope, so the lead survives. This
is deliberate: returning 200 from an unconfigured endpoint would show someone
"thanks, we'll be in touch" while the enquiry went nowhere. Never make that
endpoint optimistic.

Deploy `api/enquiry.js` the same way as `api/broll.js` — it is the same
Web-standard `Request -> Response` handler.

### Contact form

`src/pages/Contact.jsx` validates and then **does not submit anywhere** — it
just shows the success state. It predates the scope builder and still needs
wiring; the quickest fix is to point its `handleSubmit` at `/api/enquiry`,
which already accepts a name, email, phone and message.

### Client brands — `public/goodwork/brands/`

Each client brand built on the engine gets a folder here, served statically
at `/goodwork/brands/<slug>/` (the `/goodwork/` path is already excluded from
the SPA rewrite). The folder is the handover: a `brand.css` in the engine's
token vocabulary, a `BRAND.md` and `guidelines.html` that say the same thing
as a document and as a page, a prototype `index.html`, the logo artwork in
`logo/` and the typeface in `fonts/`.

The logo artwork is generated, not drawn: `logo.config.mjs` describes the
marks (which words, in which weights, on which lines) and the colour
applications, and `npm run brand:logo -- <slug>` turns every glyph into
outlined paths with opentype.js and rasterises PNGs from those same paths.
The SVGs open anywhere with nothing installed; the PNGs are computed edges,
never upscaled ones. Re-run it after any change to the config, and commit
the output — like the image derivatives, the deploy must not depend on it.

Photography works the same way: drop a file in `photos/`, run
`npm run brand:photos -- <slug>`, and the pages pick up the WebP copies
through `srcset`. Both outputs are committed, for the same reason the image
derivatives are — a deploy must not depend on a working `sharp` install.

Current brands: `beauty-heaven-hub`.

### Favicon

`public/favicon.svg` is the GOOD WORK. mark. The previous one, inherited from
the Vite starter, is kept at `public/favicon-legacy.svg` if it's ever wanted
back.
