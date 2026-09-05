# PMB × GOOD WORK. Motion Library — what exists, what doesn't

§16 of the PMB brand guide makes this repository a dependency, not a
reference:

> The PMB website must use the GOOD WORK motion library as the primary
> interaction and animation system. Bespoke video/AI sequences sit on top of
> that system; they do not replace it.
>
> During implementation, select the closest production-ready motion from the
> library before creating a custom web animation.

That instruction only works if the library actually covers the homepage motion
map §16 specifies. This is the audit, run against
`public/goodwork/library-src/components.txt` — **170 components** across
Buttons, Text Animations, Animations, Backgrounds, Special Effects,
Components, Carousels, Sections, Device Mocks and Community.

**Headline: eight of the eleven mapped sections are covered by existing
components. Three need building, and one of the three is the interaction the
brand guide calls a primary one.**

---

## The homepage motion map

| §16 section | Required behaviour | Library components | Status |
| --- | --- | --- | --- |
| **Hero** | Cinematic text / image reveal | `wordrise` · `textreveal` · `blurfade` · `boxreveal` · `textanimate` · `herosplit` · `herocentered` · `herostats` | **Covered** |
| **Trust strip** | Counter / number reveal, once, no loop | `countup` · `ticker` · `statscount` · `statsgrid` | **Covered** — see note 1 |
| **Services** | Staggered cards / image reveal | `stagger` · `bento` · `magicbento` · `bouncecards` · `featuregrid` | **Covered** — see note 2 |
| **Before & after** | Reveal / scrub interaction | *nothing* | **Missing** — see gap A |
| **Craft / build-up** | Scroll sequence: excavation → Type 1 → compaction → edging/drainage → finish | `featurescroll` · `featureaccordion` · `stepper` · `scrollprog` | **Partial** — see gap B |
| **Projects** | Masked image / editorial reveal | `pixelimage` · `blurfade` · `circulargallery` · `boxreveal` (text only) | **Partial** — see gap C |
| **Estimator** | Progress / state transition | `stepper` · `scrollprog` · `circularprogress` · `ring` | **Covered** |
| **Reviews** | Ticker / controlled carousel, with pause | `testimonials` · `testimonialcarousel` · `testimonialscroll` · `testimonialwall` · `logoloop` | **Covered** — see note 3 |
| **AI assistant** | Panel transition / response state | `terminal` · `animlist` · `fcreply` · `fcnotify` · `fcstream` | **Partial** — assemble, don't build |
| **Final CTA** | Strong reveal / magnetic CTA | `magnetic` · `ctabadge` · `ctabox` · `ctamarquee` · `ctaavatars` · `ctaquote` | **Covered** |
| **Navigation** | Sticky, compact, transparent → forest on scroll | `navbar` · `gooeynav` | **Covered** |

Plus, from §07 of the brand guide:

| Requirement | Library components | Status |
| --- | --- | --- |
| Material hover/tap — resin, block paving, tarmac, porcelain respond with texture and project imagery | `magiccard` · `pixelcard` · `glarehover` · `tiltedcard` · `flowingmenu` · `lens` | **Covered** — `pixelcard` and `lens` are the closest to a material reveal |
| Aggregate transition | `particles` · `meteors` · `clickspark` | **Adaptable, badly** — see gap D |

---

## The three gaps

### Gap A — Before/after scrub. **Build this first.**

There is **no image comparison component in the library.** The nearest match
is `codecompare`, which is a before/after *diff card* for source code, not
images.

This matters more than any other item here. Build rule 4 in the brand guide:

> Before/after is a primary interaction, not a buried gallery feature.

And §16 requires: *"Always provide a simple slider/tap alternative."*

It is also the highest-value asset PMB can produce — every completed job
generates one for free. A paving business without a before/after slider is
missing its single best sales device.

**What to build:** a draggable divider over two identically-framed images,
with

- pointer, touch **and keyboard** control (arrow keys on a focusable handle),
- a scroll-led variant for the hero,
- a static side-by-side fallback under `prefers-reduced-motion`,
- labelled BEFORE / AFTER chips that survive the fallback.

It belongs in `components.txt` as a general library component
(`beforeafter :: Before / After Scrub :: Components`), not as a PMB one-off —
every trades, renovation and restoration client this agency takes on will want
it.

### Gap B — Pinned scroll sequence

`featurescroll` is a sticky two-column layout and `featureaccordion`
auto-advances on a timer. Neither is a **scroll-scrubbed** sequence where
progress through the section drives the frame.

The craft/build-up section needs the five ground layers to reveal *as the user
scrolls*, because §16 requires it to be "educational, not decorative" — a
timer-driven version teaches nothing, since the user isn't controlling it.

`--pmb-ground` in `brand.css` already defines the five bands. What's needed is
the scroll-progress driver: an IntersectionObserver plus a
`requestAnimationFrame` loop mapping section progress to a `--progress`
custom property, which is the same shape as the engine's existing parallax
hook in `src/lib/motion.js`.

Reduced-motion fallback: show all five layers labelled, statically. That is
arguably the better version anyway.

### Gap C — Masked image reveal

`boxreveal` wipes a coloured box across **text**. §16's Projects row asks for
masked *photography* that "opens as if a surface is being laid across the
screen" — the same wipe applied to an image, with the mask travelling in the
direction of laying.

Small piece of work: it's `boxreveal`'s keyframes applied to a `clip-path` on
an image wrapper. **Watch the clipping trap** documented in the repo README —
never observe the element you're clipping, or it reports a zero intersection
ratio and hides itself permanently. Clip an inner wrapper, observe the outer.

### Gap D — Aggregate transition (Layer 3, not Layer 1)

`particles` and `meteors` are generic drifting-mote fields. Using either as
"aggregate" is exactly what §07 rules out:

> No random floating blobs, generic tech particles or effects unrelated to
> PMB.

The aggregate transition is a **Layer 3 cinematic asset** — real macro footage
or a Higgsfield sequence — not a Layer 1 UI component. Don't reskin
`particles` and call it aggregate. It will read as a tech startup, which is
the one thing this brand must not do.

---

## Three notes on components that are covered

**1 · Trust-strip counters must fire once.** §16 is explicit: *"No looping
counters."* Every counter in the library — `countup`, `ticker`,
`circularprogress`, `statscount` — loops on a `setInterval` **because it is a
gallery preview that has to demo itself**. `countup` even carries the
production line commented out:

```js
// PRODUCTION: new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting&&e.target.classList.add('in'))).observe(el);
```

Copy-pasting the preview code ships an infinitely counting trust strip. Swap
the interval for the IntersectionObserver, and unobserve after the first fire.

**2 · Tap must work without hover.** §16's rule on the services row. Several
card components in the library are hover-only: `magiccard`, `tiltedcard`,
`pixelcard`, `glarehover`, `lens`, `dock`, `folder`, `flowingmenu`. On touch
these do nothing at all, or worse, require a double-tap to activate the link
underneath. Each needs a `pointer: coarse` path — usually reveal-on-view
instead of reveal-on-hover.

**3 · Reviews need real pause controls.** §16: *"Pause controls and no frantic
marquee."* The library's marquees pause on **hover only**
(`animation-play-state: paused`) — `testimonialcarousel`, `companymarquee`,
`infinitespiral`. Hover isn't available on touch, and a hover-only pause is
not an accessible control. WCAG 2.2.2 requires a mechanism to pause any
motion running longer than five seconds. Add a real button.

---

## The reduced-motion problem

This is the finding with the widest blast radius.

**Only 10 of the ~170 library components carry their own
`prefers-reduced-motion` query.**

The GOOD WORK. site itself is fine — `src/styles/motion.css` has a global
off-switch at the bottom that covers the engine's own `[data-gw-reveal]`
system and `.gw-*` classes. But the library's snippets are, by design,
**standalone**: the README says each one is "drop-in vanilla HTML/CSS/JS" that
"works the same in React, Vue or a plain page". A snippet lifted out of the
gallery and dropped into PMB brings its own `<style>` block and its own
`@keyframes`, and the engine's off-switch does not reach it.

That collides directly with build rule 10 and §07:

> Respect reduced-motion preferences and preserve a complete static
> experience.

**Two ways to fix it, and the second is better:**

1. Add a reduced-motion query to every animated snippet in `components.txt`
   and rebuild the gallery (`node library-src/build-library.mjs`). Thorough,
   about 160 small edits, and it improves the library for every future client.
2. As an interim, wrap the PMB build in a global stop:

   ```css
   @media (prefers-reduced-motion: reduce) {
     *, *::before, *::after {
       animation-duration: 1ms !important;
       animation-iteration-count: 1 !important;
       transition-duration: 1ms !important;
       scroll-behavior: auto !important;
     }
   }
   ```

   This is a blunt instrument. It stops motion but does **not** guarantee a
   *complete* static experience — anything whose content only becomes visible
   at the end of an animation (`stagger`, `wordrise`, `boxreveal`, `reveal`)
   needs its end state asserted too, or reduced-motion users get blank space.

Do (2) to ship, then do (1) properly. Either way, **check each snippet's
static end state**, not just that it stopped moving. "Still" and "usable" are
different tests, and the repo README already says so.

---

## Recommended order of work

1. **Build `beforeafter`** into the library. Blocks the homepage's primary
   interaction, and it's reusable across the agency's whole client base.
2. **Fix the counters** to fire once on view. One-line change, but it's
   visible on the trust strip in the first screen.
3. **Add the global reduced-motion stop** to the PMB build, and assert static
   end states on every reveal used.
4. **Build the scroll-progress driver** for the craft sequence.
5. **Extend `boxreveal` to images** for the projects section.
6. **Add coarse-pointer paths** to the card components used on services and
   materials.
7. **Add a real pause control** to the reviews rail.
8. Only then commission Layer 3 cinematics. They are the top of the stack, and
   §16 puts them last for a reason: *"Real project imagery remains the proof;
   AI/cinematic assets are presentation layers, not fake portfolio work."*

Items 1–7 are all library work that makes every subsequent client build
better. That's the argument for doing them properly rather than as PMB
one-offs.
