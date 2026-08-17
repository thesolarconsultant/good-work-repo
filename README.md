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
| `npm run og` | Regenerate `public/og.png`, the social share card |
| `npm run sitemap` | Regenerate `public/sitemap.xml` |

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

### Contact form

`src/pages/Contact.jsx` validates and then **does not submit anywhere** — it
just shows the success state. Wire `handleSubmit` to a real endpoint (a form
service, or the CRM) before going live.

### Favicon

`public/favicon.svg` is the GOOD WORK. mark. The previous one, inherited from
the Vite starter, is kept at `public/favicon-legacy.svg` if it's ever wanted
back.
