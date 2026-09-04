# The Engine — build a site from a brand

One block library. One brand knob. Paste a brand identity, get the baddest
website. This is how.

The whole idea in one line: **every colour, font and corner on the site reads
from a token. `brand.css` sets the tokens. Change `brand.css`, change the
site — nothing else moves.** Proven on the live GOOD WORK. homepage: same HTML,
three totally different brands, only the token block swapped.

---

## The 5-minute recipe

1. **Copy the engine.** Take `engine/brand.css`, the block CSS
   (`assets/css/`), and the blocks you want from the catalog below.
2. **Fill the knob.** Open `brand.css` and set the seven things a brand owns
   (accent, neutrals, fonts, radius, dark band, hero scrim, shadows). There's
   a filled example (GOOD WORK.) and three ready-made pastes in the swatch book at
   the bottom of the file.
3. **Drop the logo + fonts.** Put the brand's logo in `assets/img/` and point
   `--font-*` at its typefaces (self-hosted `@font-face` or a Google Fonts
   `<link>`).
4. **Pour in the words.** Every block below is a skeleton — replace the copy,
   keep the structure. Copy is part of the brand paste, not the engine.
5. **Pick the lead theme.** In the page's inline `<head>` script, default
   `data-theme` to `"light"` or `"dark"`. Both themes already exist in
   `brand.css`; you're only choosing which one loads first.

That's the site. Steps 2–4 are the only creative work; the engine does the rest.

---

## Brands built on the engine

Each one lives in `brands/<slug>/` with its own `brand.css`, guidelines,
prototype page and logo artwork — the whole paste, in one folder.

| Brand | Lead theme | The one-line brief |
| --- | --- | --- |
| [`brands/beauty-heaven-hub/`](brands/beauty-heaven-hub/guidelines.html) | light (ivory), with taupe surfaces | Warm. Architectural. Premium. Human. Heavenly. The premises, translated into a digital brand. |

Beauty Heaven Hub adds one idea worth keeping in the engine: **surfaces**.
`data-surface="taupe"` on a section re-reads every token for that wall, so a
block painted for the page's light theme becomes a brand moment without a
second copy of its CSS. See the top of its `brand.css`.

---

## What's the engine vs. what's the brand

| The ENGINE (never changes)            | The BRAND (the paste)                     |
| ------------------------------------- | ----------------------------------------- |
| Block HTML structure                  | Accent colour + its cuts                  |
| Block CSS (reads tokens only)         | Neutral palette (ground, card, text)      |
| Motions, transitions, scroll behaviour| Display / body / logo fonts               |
| Layout grid, spacing rhythm           | Corner radius (soft / sharp / round)      |
| Two-theme machinery                   | Logo, copy, imagery                        |

If you ever find yourself editing block CSS to change a colour — stop. That
colour wants to be a token. That's the one rule that keeps the engine an engine.

---

## Block catalog

Every block uses the same token vocabulary. `--accent` for the bold moments,
`--ink`/`--body` for type, `--card`/`--line` for surfaces, `--radius` for
corners, `--font-head`/`--font-body` for type. Structure below; the live GOOD WORK.
pages are the reference implementation of each.

### `nav` — top bar
Logo + links + one accent CTA. Tokens: `--card` (pill bg), `--line`, `--ink`,
`--accent` (CTA), `--radius`.

### `hero` — the thesis
Full-bleed media + eyebrow + two-line headline (second line in `--grad-text`)
+ sub + primary/ghost CTAs. Tokens: `--scrim-rgb` + `--hero-media-filter`
(legibility wash), `--ink`, `--accent`, `--grad-text`, `--radius`.
Motion: the GOOD WORK. hero scrubs day→night on scroll — optional, driven by
`scrollstage.js`.

### `trust` — proof strip
Row of pill badges (certifications, counts, logos). Tokens: `--bg-2`, `--line`,
`--body`.

### `features` — 3-up cards
Icon chip + title + copy. Tokens: `--card`, `--line`, `--radius`, `--accent`
(icon chip), `--ink`, `--body`.

### `stats` — number band
2–4 big numbers in a raised band. Tokens: `--bg-2`, `--line`, `--accent`
(the big number), `font-variant-numeric: tabular-nums`.

### `pricing` — plan cards
3 cards, one marked popular (accent border + badge). Tokens: `--card`,
`--accent` (popular border/badge), `color-mix(in srgb, var(--accent) …)` for
tints, `--radius`.

### `cta` — closing band
Accent-gradient box, big headline, white button. Tokens: `--accent-grad`,
`--radius-lg`, white-on-accent.

### `footer` — dark band
Always the dark tokens even on a light site. Tokens: `--dark`, `--on-dark`,
`--on-dark-muted`, `--line-dark`.

### `divider` — section wave
The one shape between sections. The wash either side reads `--cream`/`--dark`
and the traced line follows `--accent` (via the shared `#gwDividerGrad`
gradient, whose stops are driven from the accent tokens).

---

## Motions library

The engine ships the movement, not just the look. All respect
`prefers-reduced-motion`.

- **Theme scrub** (`scrollstage.js`) — hero photo + page theme cross-fade
  day→night as you scroll.
- **Reveal-on-scroll** — sections fade/rise in when they enter view
  (`.is-visible` hook).
- **Count-up & ring/bar fills** — stat numbers and the app-UI chart animate
  from zero on reveal.
- **Shimmer / beam buttons** (`magic.css`) — a spark travels the border.
- **Carousels** (Embla) — brand-logos and testimonials.
- **Logo sting** (`tools/animate-logo.py`) — the winking-sun reveal for video.

Each is brand-agnostic: it moves the same, painted in whatever the tokens say.

---

## Tokenisation status

The live site is **fully tokenised** — every component in `styles.css`,
`magic.css`, `product.css` flows through the token layer. Verified by reskinning
the real homepage as three different brands (see the swatch book in `brand.css`).

- [x] Component colours → `var(--accent)` / `var(--accent-grad)`
- [x] Section wave dividers + journey spine → accent-driven gradient stops
- [x] Two-theme (light/dark) machinery
- **Logo + inline brand SVGs** (sun mark, favicons) are *brand assets*, not
  tokens — they live in the brand paste. Swap the files per brand.
