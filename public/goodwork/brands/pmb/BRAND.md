# PMB Paving & Landscapes — brand guidelines, working v1

Modern heritage. Built outside.

PMB already has the hard part: 25+ years, a family business, a substantial
body of completed work and customers who say so. This document codifies the
brand so the digital presentation finally matches the reputation the company
built offline.

It is a working version. It is derived from the *PMB Brand & Visual Style
Guide* supplied by the client, and it turns that document into the things the
build actually needs: a token file, a set of contrast-safe cuts, semantic
state colours the source guide doesn't define, and an honest account of which
motion behaviours the GOOD WORK. library already has.

**Every commercial claim in here is marked.** The guarantee, the insurance,
the no-deposit terms and the cooling-off period are all *"the current site
states"*, and all of them must be reconfirmed with PMB before launch. See §12.

What's in this folder:

| File | What it is |
| --- | --- |
| `brand.css` | The token file. Every colour, font, corner and surface on a PMB page reads from here. Same vocabulary as the GOOD WORK. engine, so any engine block or library snippet reskins on contact. |
| `guidelines.html` | This document as a page, with live swatches, type specimens and measured contrast. |
| `MOTION-AUDIT.md` | §16 of the client guide requires the GOOD WORK. motion library as the primary animation system. This is what the library actually has, mapped section by section, and what has to be built. |
| `fonts/` | Manrope and Inter, self-hosted, SIL Open Font License. |

---

## 01 · Brand idea

**Modern Heritage. Built outside.**

Rooted in craft and materials, contemporary enough to carry motion design,
an interactive estimator, AI qualification and premium photography.

| | |
| --- | --- |
| Established | not old-fashioned |
| Premium | not pretentious |
| Masculine | not aggressive |
| Natural | not rustic |
| Engineered | not sterile |
| Local and personal | not small-time |
| Confident | not loud |

**Working proposition:** TRANSFORMING HOMES FROM THE OUTSIDE IN.
Alternative campaign line: BUILT OUTSIDE. BUILT PROPERLY.

**North star:** make PMB look online as good as its reputation says it is
offline.

### Message hierarchy

1. **Transformation** — exterior transformations that improve how a property
   looks, works and feels.
2. **Trust** — 25+ years, family-run, no-deposit proposition\*, five-year
   guarantee\*, insured\*, free survey and written quotation.
3. **Craft** — preparation, drainage, sub-base, materials and finishing matter
   as much as the visible surface.
4. **Proof** — real projects, before/after, genuine reviews.
5. **Ease** — estimator, AI assistant, CRM follow-up, clear next steps.

\* Reconfirm before launch — §12.

## 02 · Logo

The recommendation is **evolution, not rebrand**. PMB has years of recognition
on vehicles, workwear, signage and online profiles, and that is an asset.

- Retain the PMB name and the basic visual DNA.
- Redraw geometry and spacing properly.
- Fix the relationship between **PMB** and *PAVING & LANDSCAPES* — currently
  the descriptor is doing too little work at small sizes and too much at large.
- Produce horizontal, stacked, monogram and single-colour versions.
- Produce dedicated applications: van livery, workwear embroidery, signage,
  favicon, social avatar.

**Primary applications:** Forest on Chalk · Chalk on Forest · one-colour black
or white where a printer or embroiderer needs it.

### Do not

No gradients. No gloss, bevels or drop shadows. No fake stone texture inside
the mark. No Celtic or Irish motifs, and no bright green because of the
owner's heritage — the brand should feel relevant to the work, not themed
around nationality.

### The gold question

The concept mockup in the source guide sets the PMB wordmark **large and in
Warm Metal** in both the header and the footer. That contradicts two rules in
the same document: Warm Metal is specified as *"optional tiny accent only —
never a dominant gold"* (§03), and the primary logo applications are specified
as Forest on Chalk, Chalk on Forest and one-colour (§05).

**Resolved here in favour of the rules.** A gold wordmark on a dark green nav
is a 4.75:1 pair — legible, but it reads as the visual centre of the page and
it pulls the brand towards the generic premium-contractor look the positioning
is trying to escape. `brand.css` therefore never sets the logo in metal, and
`--pmb-metal` is scoped to hairlines and micro-labels.

If PMB or the client want the gold wordmark, that is a legitimate call to
make — but it is a change to §03, not an exception to it, and the balance
guidance below has to be rewritten with it.

`.pmb-logo` in `brand.css` sets the lockup as live text in Manrope ExtraBold.
It is a stand-in. **When the redrawn artwork arrives it becomes the master**,
goes in a `logo/` folder here, and the live-text version is retired to
favicon-sized fallbacks.

## 03 · Colour

Forest, limestone, chalk and charcoal. Landscape, stone, earth and British
architecture — with one distinctive signature colour.

| Colour | Hex | Role |
| --- | --- | --- |
| PMB Forest | `#16382C` | Primary brand colour · CTAs · key moments |
| Deep Forest | `#0D211A` | Hero overlays · footer · cinematic dark sections |
| Warm Limestone | `#E8E1D4` | Material-led panels · cards · editorial sections |
| Chalk | `#F6F3EC` | Primary page background |
| Charcoal | `#181A18` | Typography · dark vehicles · high contrast |
| Concrete | `#8D8B84` | Dividers · neutral UI |
| Warm Metal | `#B59A63` | Tiny accent only — never a dominant gold |

### Working cuts

The seven above are tuned for surfaces and the logo, not for a line of 14px
type. Two of them fail as text on a light ground, so `brand.css` carries
lightness-only cuts for the places contrast law applies:

| Token | Hex | Why |
| --- | --- | --- |
| `--pmb-concrete-ink` | `#646259` | Concrete as text. The brand value reaches only **3.08:1** on Chalk and **2.62:1** on Limestone; the source guide assigns it "secondary text". The cut clears **5.52 / 4.70**. |
| `--pmb-metal-ink` | `#7C632D` | Warm Metal as text on a light ground. Brand value is **2.44:1** on Chalk; the cut clears **5.15**. |
| `--pmb-metal-light` | `#C5AC79` | Warm Metal lifted, for text on Deep Forest. |
| `--pmb-forest-lift` | `#4A9B77` | Forest can't be both the page and the accent in dark mode. This carries links and outlines there. |
| `--pmb-chalk-2` `--pmb-chalk-card` `--pmb-limestone-2` | | Alternating sections and cards that lift without a border. |

**Concrete `#8D8B84` never carries body copy on a light ground.** Use it for
dividers, hairlines, disabled states and large text only. On Deep Forest it is
fine (4.93:1).

Measured pairs that pass for text: charcoal on chalk **15.8:1** · forest on
chalk **11.6:1** · chalk on forest **11.6:1** · metal on deep forest **6.2:1**
· concrete on deep forest **4.9:1**.

### Balance

Roughly **55% chalk · 20% limestone · 20% forest and deep forest · 5%
charcoal**, with Warm Metal under 1%.

> Green is the recognisable PMB signature, not the wallpaper.

Most of the site breathes in chalk and limestone. Forest is for decisive
moments: navigation states, CTAs, the trust strip, the estimator panel,
selected full-width sections and the footer. If more than about a fifth of a
scroll is green, the signature has become the background.

### State colours

The source guide has no semantic palette, and the build has a nine-step
estimator with validation and a file upload. Rather than let each form invent
its own red, `brand.css` defines them:

| Token | Light | Dark | Note |
| --- | --- | --- | --- |
| `--state-error` | `#A33A2A` | `#E58C7A` | 5.9:1 on chalk |
| `--state-warn` | `#8C6D1F` | `#E8B45C` | |
| `--state-success` | `#1E6B4A` | `#6FCB9F` | Deliberately *not* PMB Forest — a valid field must not read as a brand fill |
| `--state-info` | Forest | `--pmb-forest-lift` | |
| `--focus-ring` | forest halo | metal halo | Focus is never carried by fill colour alone |

## 04 · Typography

Architectural, direct, readable. The type has to work on a van at 30 metres,
a phone at 30 centimetres, and a case study with real technical copy.

**Manrope ExtraBold** — display, headlines, navigation emphasis, numbers,
section titles. Tight tracking (`-0.025em`), strong line breaks, sentence case
with short uppercase moments.

**Inter** — body, controls, forms, labels, estimator fields, long-form service
content.

Both self-hosted from `fonts/` under the SIL Open Font License. Manrope earns
the display role on a tall x-height and closed apertures that survive
extra-bold uppercase at distance; Inter takes the UI because the estimator is
a nine-step form and Inter was drawn for that.

| Level | Desktop | Mobile |
| --- | --- | --- |
| Hero | 64–96px | 42–56px |
| Section headline | 40–64px | 30–40px |
| Card headline | 22–30px | |
| Body | 16–18px, generous line-height | |
| Micro label | 11–13px uppercase, `0.14em` tracking | |
| Trust figures | oversized numerals, short supporting line | |

Helpers: `.pmb-display`, `.pmb-figure`, `.pmb-micro`.

### Copy style

Short. Concrete. Confident. The language of transformation, workmanship,
materials, preparation, trust and proof. No inflated luxury language, no
contractor clichés.

## 05 · Physical → digital

The interface is taken from what PMB builds. In `brand.css` each one is a
token, so nothing is decoration for its own sake.

| On site | On the page | Token |
| --- | --- | --- |
| Block paving, stretcher bond | A hairline lattice behind a section, offset row to row | `--pmb-bond`, `.pmb-bond` |
| Limestone and resin surfaces | Fine grain at very low opacity, never over body copy | `--pmb-grain`, `.pmb-grain` |
| Excavation → Type 1 → compaction → laying course → surface | The five-band cutaway behind the process explainer | `--pmb-ground`, `.pmb-ground` |
| Kerbs and edging | One decisive 2px square-cut line, never a fading hairline | `--pmb-edge` |
| Compaction | The motion signature: things **settle**, they never bounce | `--pmb-settle` |

Corners are near-square (`--radius: 4px`). Everything PMB lays is a flat unit
with a cut edge, and the interface should agree with that.

## 06 · Photography

**The work is the hero.** The site should look expensive because the projects
look expensive, not because the interface is decorated.

Shot list:

- **Finished driveways** — wide enough to show the whole property.
- **Before/after pairs** — same angle, same lens, same time of day wherever
  possible. This is the single most valuable asset type PMB can produce.
- **Material detail** — low angle: joints, edging, aggregate, kerbs, steps,
  drainage.
- **Process** — excavation, Type 1 sub-base, compaction, screeding, laying,
  finishing. This is what proves §01's "Craft" message.
- **Team** — Patrick and the crew on real sites. Clean, not staged.
- **Twilight** — finished projects where lighting and landscaping do the work.
- **Drone / top-down** — only where it genuinely explains scale and layout.

**Treatment:** natural colour, controlled contrast, deep greens, warm stone,
realistic skies. `--hero-media-filter` is deliberately light (`brightness
0.82`) — enough to hold type over a driveway, not enough to flatten the stone.

**Never:** oversaturated HDR · obvious AI architecture · stock photos of
unrelated homes · fabricated customer imagery. Cinematic and AI assets are a
presentation layer (§07 Layer 3); they are never presented as portfolio work.

## 07 · Motion

Motion comes from what PMB physically does. Every major animation either
explains construction, reveals a transformation, or makes the interface easier
to use. If it does none of those, it doesn't ship.

The stack, per §16 of the client guide:

| Layer | What |
| --- | --- |
| 1 · GOOD WORK. UI motion | Page reveals, text entrances, counters, tickers, hover/tap, nav transitions, card reveals, image masks, scroll choreography |
| 2 · PMB material choreography | Those same patterns, adapted to laying, stacking, revealing and transforming surfaces |
| 3 · Cinematic assets | Higgsfield or equivalent for the impossible shots — paving assembling, surfaces breaking away, aggregate transitions, ground-drop |
| 4 · Functional motion | Estimator progress, AI assistant state, upload confirmation, success states |

**Layer 1 is the default.** Select the closest production-ready motion from
the GOOD WORK. library before writing a custom animation.
`MOTION-AUDIT.md` in this folder maps every homepage section to what the
library actually has today, and names the three things that need building.

The signature: **things settle.** `--pmb-settle` is a short travel with a firm
stop — compaction, not a spring. Nothing in PMB bounces, floats or drifts.

### Restraint

- No floating blobs, tech particles or effects unrelated to paving.
- No animation delays a quote, a phone call, an estimator step or the AI
  conversation.
- Don't animate everything. Strong moments need quiet around them.
- Mobile gets simpler, faster versions of heavy sequences.
- `prefers-reduced-motion` is respected, and the static experience is
  complete — not just still. **This needs checking per snippet:** only 10 of
  ~170 library components carry their own reduced-motion query (see
  `MOTION-AUDIT.md`).

## 08 · Interface

Calm enough for a homeowner making a five-figure decision, and visibly more
advanced than a standard contractor site.

- **Navigation** — compact, sticky; transparent over the hero, deep forest on
  scroll. One clear CTA: *Plan My Project*.
- **Buttons** — solid Forest primary; outline Charcoal secondary; minimum 44px
  touch height; visible focus ring on every surface.
- **Cards** — minimal borders, near-square corners, large photography. No
  generic icon grids unless they genuinely aid scanning.
- **Forms** — large labels, plain English, one decision per step where
  possible.
- **Trust strip** — immediately below the hero.
- **Project cards** — service + location + image, opening into real case
  studies.
- **Reviews** — large, specific and contextual. Not a carousel of tiny quotes.
- **Texture** — `.pmb-grain` at `0.045` opacity. Never over body copy.

## 09 · Architecture

Authority built around real work, not hundreds of thin pages.

| Hub | Purpose |
| --- | --- |
| Home | Transformation hero, trust, services, before/after, estimator, projects, reviews, process, CTA |
| Driveways | Block paving · resin bound · tarmac · gravel and other finishes |
| Patios & Outdoor Living | Patios, natural stone, Indian sandstone, porcelain *where confirmed*, paths and entrances |
| Landscaping | Full transformations, fencing, turfing, walls, drainage, groundworks |
| Restoration | Jet washing, repairs, maintenance, professional cleaning |
| Projects | Real case studies: before/after, location, material, notes, review |
| Areas | Harlow, Bishop's Stortford, Chigwell, Romford, Woodford and other verified coverage |
| About | Family-run story, 25+ years, Patrick and the team, workmanship, process, guarantees |
| Plan My Project | Estimator and qualification flow |
| Contact | Free survey, phone, email, location, response expectations |

**SEO rule:** SERVICE × LOCATION × REAL PROJECT × REAL REVIEW. Blog content
supports that authority; it does not replace it. Location pages need genuine
local relevance, not keyword swaps.

### A note on the service count

The source guide frames **four** services in the homepage copy direction
(Driveways · Patios · Landscaping · Restoration) but the concept mockup shows
**five** cards, adding Groundworks. Groundworks is real work PMB does and it
is listed under Landscaping in §09. Pick one and make the homepage, the nav
and the IA agree — the mockup and the copy direction currently don't.

## 10 · Voice

Straight-talking confidence. Experienced people who know the work — not an
agency writing about dream outdoor sanctuaries.

**Use:** specific materials and processes · short statements backed by proof ·
real locations and real projects · plain-English explanations of trade-offs ·
reassurance around surveys, quotes, guarantees and next steps · genuine
customer language, accurately quoted and attributed.

**Avoid:** *"quality you can trust"* with no evidence · unsupported
superlatives (*"best in Essex"*) · invented accreditations, guarantees, prices,
durations or quotes · luxury clichés (*"bespoke oasis"*, *"where dreams become
reality"*) · daily SEO copy that adds no local or project evidence.

> **Good:** "The finish matters. So does everything underneath it."
> **Weak:** "We create stunning outdoor spaces tailored to your unique lifestyle."

## 11 · The interactive sales experience

The site starts qualifying before anyone picks up the phone.

**Plan My Project** — nine steps: project type · approximate size (m²) ·
preferred finish · existing surface · additional work · postcode · timeframe ·
photo upload · contact details.

The estimator returns **an indicative range only**. That has to be stated in
the interface, not the small print: final pricing remains subject to a free
site survey, ground conditions, access, drainage and final specification.

> The concept mockup shows five estimator fields and a resolved
> £8,500–£12,500 range. The written spec is nine steps. Nine is the spec;
> the mockup is a compressed illustration of it. Decide deliberately — a
> five-field estimator produces a range wide enough to be useless, and a
> nine-field one loses people. A short qualifying set with progressive
> disclosure is the likely answer.

**AI Project Assistant** — inherits estimator context and continues naturally
rather than restarting the questionnaire. Answers from the PMB knowledge base,
qualifies, collects missing detail, routes the lead, and **escalates
uncertainty rather than guessing**. It must never invent a price, a guarantee
or an accreditation.

**Routing:** high-value or urgent → priority notification · standard → CRM
pipeline · long-term → nurture · existing customer → service route ·
commercial → commercial route.

## 12 · Facts, and what has to be reconfirmed

These come from PMB's live website and form the factual knowledge base for the
rebuild — including for the AI assistant.

| Category | Current-site fact |
| --- | --- |
| Business | PMB Paving and Landscapes Ltd; company registration 09859691 |
| Experience | Family-run, over 25 years in the paving industry |
| Coverage | Hertfordshire, Middlesex, Essex, North London. Named: Harlow, Bishop's Stortford, Romford, Chigwell, Woodford, Saffron Walden, Dunmow and surrounding areas |
| Driveways | Block paving, resin bound, tarmac, gravel, shingle, imprinted concrete, crazy paving |
| Patios | Indian sandstone, natural stone, concrete slabs |
| Other | Pathways and entrances, repairs, maintenance, professional cleaning, fencing, turfing, small groundworks, walling, drainage |
| Resin | UV-stable resin/aggregate systems, permeability, slip resistance, weed and stain resistance, custom colours and borders, free design service |
| Preparation | Type 1 hardcore and professional compaction before the chosen top surface |
| Contact | 020 8485 7610 · 01279 899 927 · 07931 467924 · info@pmbpavingandlandscapes.co.uk |
| Address | Unit A, 57 Park Road, Crouch End, N8 8SY |

### Reconfirm before launch — every one of these

> The current site states: **£1m public liability insurance** · **five-year
> guarantee on all work** · **fully registered and fully insured** · **no
> deposit required, payment after completion and satisfaction** · **free
> written no-obligation quotations** · **seven-day cooling-off period**.

These are the highest-liability content on the site. They appear in the hero
trust strip, throughout the service pages, and in the AI assistant's knowledge
base — which means a stale claim gets repeated by a chatbot on demand. Get
them confirmed in writing by PMB immediately before launch, and again whenever
the assistant's knowledge base is refreshed.

The material and installer logos currently shown (Bradstone, Natural Paving,
Marshalls, Hanson, Brett) need the same treatment: confirm what is a genuine
approved-installer relationship and what is simply a material PMB buys. The
two are not the same claim, and only one of them can be presented as an
accreditation.

**Also placeholder:** the phone number in the concept mockup
(`01279 123 456`) is not a PMB number. The real numbers are in the table
above.

## 13 · Growth engine

One job becomes many assets. PMB shouldn't need to invent marketing content —
the work completed every week feeds the site, search, social, email and
reviews.

```
ENQUIRY → QUALIFIED → SITE SURVEY → QUOTE → FOLLOW-UP → WON
        → SCHEDULED → IN PROGRESS → COMPLETE → REVIEW → CONTENT
```

**Console input per job:** before photos · during photos · after photos ·
location · service and material · approximate size · duration · short job
notes · customer review.

**Outputs:** website case study · Google Business post · Instagram and
Facebook · before/after Reel · email content · service-location proof · review
creative · ad creative.

## 14 · Build rules

The hand-off checklist. If the build drifts, come back here.

1. Use the forest / limestone / chalk / charcoal palette consistently, from
   `brand.css`. Never a raw hex in a component.
2. Use real PMB imagery wherever available. Label concept visuals clearly.
3. The homepage communicates **transformation + trust within the first
   screen**.
4. Before/after is a **primary interaction**, not a buried gallery feature.
   The library does not have this yet — see `MOTION-AUDIT.md`.
5. Motion comes from materials, construction and transformation.
6. The estimator states plainly that pricing is indicative and subject to
   survey.
7. The AI assistant answers from the PMB knowledge base and escalates
   uncertainty. It never invents a price, guarantee or accreditation.
8. Every service page carries real proof: a project, a review, a process or a
   material detail.
9. Location pages carry genuine local relevance.
10. Mobile is first-class: large controls, fast load, reduced-motion support,
    clear tap targets. Check reduced-motion per library snippet.
11. **Reconfirm guarantee, insurance, no-deposit and payment terms,
    accreditations and any price claim with PMB before launch.**
12. Don't copy the old site verbatim. Preserve the facts, rewrite the voice.

## 15 · The benchmark

**ESTABLISHED. ENGINEERED. ORGANISED. VISUAL. PREMIUM.**

> Does this feel like a 25+ year company with serious workmanship and serious
> proof — or does it feel like another paving template? If it feels generic,
> it isn't finished.

---

## Using this with the engine

1. Point a page at `brand.css` instead of the GOOD WORK. one. Every engine
   block and library snippet reads the same tokens.
2. Lead light (`data-theme="light"`, chalk) and paint the brand moments with
   `data-surface="forest"` or `"deep-forest"` on the section. Material bands
   take `data-surface="limestone"`.
3. Texture goes on the section: `.pmb-bond` for the paving lattice,
   `.pmb-grain` for limestone grain, `.pmb-ground` for the construction
   cutaway. Never over body copy.
4. Before pulling a snippet out of the motion library, check
   `MOTION-AUDIT.md` — several need a reduced-motion query added, and the
   before/after interaction doesn't exist yet.

## Source

Consolidated from the *PMB Brand & Visual Style Guide* (client-supplied) and
PMB's live website:

- https://pmbpavingandlandscapes.co.uk/
- https://pmbpavingandlandscapes.co.uk/driveways/
- https://pmbpavingandlandscapes.co.uk/resin/
- https://pmbpavingandlandscapes.co.uk/landscaping-in-harlow/
- https://pmbpavingandlandscapes.co.uk/contact-us/
- https://pmbpavingandlandscapes.co.uk/leading-paving-contractors-in-harlow/
- https://pmbpavingandlandscapes.co.uk/resin-driveways-in-harlow/

GOOD WORK. Motion Library: https://goodworkagency.uk/goodwork/library.html
