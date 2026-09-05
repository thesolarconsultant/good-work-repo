# PMB photography

Photo slots in `index.html` load from this folder by filename. A slot whose
file is missing removes its `<img>` and falls back to a labelled placeholder,
so the page never shows a broken image.

| File | Slot |
| --- | --- |
| `hero-driveway-twilight.jpg` | Hero |
| `ba-01-before.jpg` | Before/after — before state |
| `ba-01-after.jpg` | Before/after — after state |
| `panel-stone.jpg` | Texture behind the estimated range in the estimator |
| `service-*.jpg` `project-*.jpg` | The five service tiles and five project cards |

## Provenance — read before this goes anywhere near a customer

**The files currently here are AI-generated concept visuals**, made with
Higgsfield for the pitch. They are not photographs of PMB's work, not a real
property, and not a real job.

That is a legitimate use under BRAND.md §07 — cinematic and AI assets are a
Layer 3 presentation layer — but only while they stay labelled as concept
work. Two rules follow from it:

1. **They must never appear in Projects, case studies or anything that reads
   as portfolio.** BRAND.md §06: real project imagery remains the proof;
   AI assets are not fake portfolio work.
2. **They must be replaced with real PMB photography before launch**, and the
   concept-visual note in the page footer removed at the same time.

Real photography drops in under the same filenames and takes the slots with
no code change. Shoot the before/after pair from a marked camera position:
same angle, same lens, same time of day.

## A note on `panel-stone.jpg`

It sits behind the estimated range, under a scrim, so it is the one image
here whose replacement needs checking rather than just dropping in. The
scrim is fixed at .56/.70; against this texture the brightest pixel of the
composite lands at 5.09:1 for chalk text and the mean at 9.6:1. A lighter
stone would push the brightest point under 4.5:1 and the small
"ESTIMATED RANGE" label would fail. If you swap it, re-measure the ground
with the panel's text hidden — an average is not enough, because a single
bright slab under the label is what breaks it.
