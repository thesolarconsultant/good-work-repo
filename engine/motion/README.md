# GOOD WORK. Motion — one include, all movement

Drop two files into any site and **every motion is available at once**. Add a
class or a `data-` attribute to an element and it animates — the runtime wires
the scripted ones automatically on load. No build step, no framework, no
per-element JavaScript. Works in plain HTML, React, Vue, anything.

## Install (the whole kit, one time)

```html
<link rel="stylesheet" href="/engine/motion/goodwork-motion.css">
<script src="/engine/motion/goodwork-motion.js" defer></script>
```

That's it. Everything below now works anywhere on the page. Colour comes from
your brand — the kit reads `var(--accent, #FF5722)` and `var(--accent-2, …)`, so
whatever `brand.css` sets, the motion matches.

## Use it — pure CSS (just add a class)

| Class | Effect |
| --- | --- |
| `om-shimmer` | light sweep across a button |
| `om-beam` | conic beam traveling the border |
| `om-pulse` | pulsing ring behind a button |
| `om-glow` | breathing shadow |
| `om-rainbow` | animated multi-hue fill |
| `om-aurora` / `om-gradient-text` | living gradient text (on headings) |
| `om-shiny-text` | sheen sweep over text |
| `om-marquee` | endless scroll (wrap one child row) |
| `om-float` | gentle bobbing |
| `om-orb` | ambient glow orb |
| `om-border-beam` / `om-shine-border` | animated card borders |
| `om-dots` | drifting dot-grid background |
| `om-caret` | blinking cursor after text |

## Use it — scripted (add a `data-` attribute, the runtime does the rest)

| Attribute | Effect |
| --- | --- |
| `data-om-reveal` | fade + rise in on scroll (`="left" / "right" / "scale"`) |
| `data-om-stagger` | on a parent — stagger its `data-om-reveal` children |
| `data-om-count="80%"` | count up to the number when it scrolls into view |
| `data-om-ticker="1284"` | odometer digit roll |
| `data-om-typing="Hello."` | typewriter (pair with `class="om-caret"`) |
| `data-om-rotate="a,b,c"` | cycle words in place |
| `data-om-scramble="TEXT"` | decode from noise |
| `data-om-magnetic` | lean toward the cursor (`="0.4"` sets strength) |
| `data-om-particles` | fill the element with drifting motes |
| `data-om-meteors="9"` | spawn N falling streaks |
| `class="om-ripple"` | ripple from the click point |

### Example

```html
<h1 class="om-aurora">Your home, working together.</h1>
<button class="om-shimmer om-ripple">Get a plan</button>

<section data-om-stagger>
  <div class="card" data-om-reveal>…</div>
  <div class="card" data-om-reveal>…</div>
  <div class="card" data-om-reveal>…</div>
</section>

<span data-om-count="80">0</span>% lower bills
```

## Dynamic content

The runtime auto-runs on `DOMContentLoaded`. After you inject new markup
(SPA route change, a fetched list), call `GOODWORK.init(container)` to wire it.

## Accessibility

Every effect is disabled under `prefers-reduced-motion: reduce` — reveals snap
to visible, loops stop. Nothing to configure.
