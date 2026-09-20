# Pigmentation — 30s

The first film. One question the salon actually gets asked, answered honestly,
with the payoff being a consultation rather than a product.

## The length problem, first

The script as briefed is **142 words across 30 seconds**. A calm, premium read
sits at about 2.6 words a second, so 142 words is **roughly 55 seconds**. The
timecodes and the copy are describing two different films.

Two ways out, and they are both fine:

- **A 30s cut** — the copy below, tightened to 63 words. Keeps the hook, the
  argument and the honest ending. Loses the "what's going on in your life"
  line, which is a shame.
- **A 60s cut** — the full briefed script, timecodes doubled. Reels hold
  attention at 60s when the first three seconds earn it, and "you can't scrub
  pigmentation away" earns it.

Everything below is written for the 30s cut.

## The voiceover, for ElevenLabs v3

Paste one block at a time. The bracketed tags are v3 audio tags — they are
direction, not spoken. Keep the ellipses and the full stops: v3 reads
punctuation as timing, and this film wants air in it.

**Voice 1 — the narrator.** Warm, unhurried, close to the mic. Not a
voiceover artist, a person who works there.

```
[calm] You can't scrub pigmentation away.

[thoughtful] It isn't something a face wash fixes. It's sun... hormones... or injury to the skin. [slower] And each one behaves differently.

[warm] So we don't start with products. We start with a consultation.
```

**Voice 2 — Hollie.** See the note below before you generate this one.

```
[measured] We treat it over time. Prescribed treatment where it's appropriate, skin boosters, peels. [pause] It's slow.

[quietly] We manage it. We don't cure it.
```

**Voice 1 — the end card.**

```
[calm] Beauty Heaven Hub. Consultations with Hollie... Tuesdays and Thursdays.
```

Settings that suit this brand: **Stability low-to-middle** (v3 needs headroom
to act on the tags), **Similarity high**, **Speed slightly under 1.0**. Render
at 48kHz and hand over the WAV, not the MP3 — it gets compressed once more on
the way to Instagram and two compressions is one too many.

## Two things to sort before this goes out

**1 · The prescription line.** The briefed wording — *"prescription agents that
block the pigment-cell from over-producing"* — describes how a prescription-only
medicine works, in an advert, to the public. That is the thing UK medicines
advertising rules are specifically about, and it does not need to be in the
film to make the point. *"Prescribed treatment where it's appropriate"* says the
same thing to the person watching and says nothing to a regulator. The version
above uses it.

**2 · Whose voice is Hollie's.** If the caption says Hollie, the voice should be
Hollie. It is eight seconds — she can read it into the same iPhone. A
synthetic voice captioned as a named clinician giving clinical advice is a
different thing from a synthetic narrator, and it is the kind of detail that
is only ever noticed once, badly. If she would rather not, drop the name and
let it stay narration.

## The shots, and where each one comes from

| Timecode | Shot | Where it comes from |
|---|---|---|
| 00:00–00:03 | Close on bare skin, held still | **Shoot it.** Real person, signed release. |
| 00:03–00:09 | Gloved hands, tray, pump bottle, appointment card | **Generate.** No faces, no readable labels. |
| 00:09–00:16 | Consultation desk, diary open, skin pen and peel bottle resting | **Generate.** No faces. |
| 00:16–00:24 | Back to bare skin, near-distance | **Shoot it.** Same release. |
| 00:24–00:30 | The sign above the door, Wombwell | **Shoot it** — or use the end card in `endcards/`. |

The rule behind that column: generate texture, hands, surfaces and rooms;
never generate the salon, the team, a client, or skin. A made-up shopfront in
Wombwell is not a stylistic choice, it is a photograph of a building that does
not exist.

**On the first and last skin shots.** The brief cuts from bare skin to the same
skin under salon light. Keep that obviously a change in the lighting. The
moment it reads as a change in the skin it is a before-and-after, and this film
is explicitly about not promising one.

## The end card

`endcards/` — built from the real wordmark and real Jost, not generated.
Espresso ground, champagne gold mark, the fluted panel held just at the edge of
visible. Four ratios: 9:16 for the reel, 4:5 for the feed, 1:1, 16:9 for the
site.

The street is still `[street]` in all four. Send the address and
`node endcard.mjs <outdir>` rebuilds them in about two seconds.

---

## The voiceover, as delivered

`Anaya — Well Spoken, Inviting`, professional voice clone, v3, speed 1.00,
stability 50, similarity 75. Those settings are right for this.

- **29.15 seconds.** It fits the 30s cut with about a second of air. The
  length problem above is solved.
- **128 kbps MP3, 44.1 kHz.** Usable, but it is a lossy file that Instagram
  will re-encode on the way in. A 48 kHz WAV out of ElevenLabs would arrive
  one compression better. Worth re-exporting while the generation is still
  in the history.
- It is **one file in one voice**, so Hollie's four lines are Anaya too. The
  flag above stands: either she reads those eight seconds herself, or the
  caption drops her name and it stays narration. Nothing else needs to change.

Measured off the frame headers, not listened to — no audio playback in this
environment. Check the read yourself before you cut to it.

## The generated plates

Five shots, two models each, 9:16 at 1536×2752, so the grade can be picked
rather than argued about. `cinematic_studio_2_5` is the film-look model;
`nano_banana_2` is the sharper, more literal one.

| Shot | Cinema Studio | Nano Banana |
|---|---|---|
| 1 · bare skin, locked off | `902fd28a` | `878555a0` |
| 2 · gloved hands, tray | `b234ea48` | `1a7ffd9e` |
| 3 · consultation desk | `308566ba` | `d8eb3ad8` |
| 4 · near-distance, turned away | `e396888e` | `c0270806` |
| 5 · signage plate | `acdca610` | `cd2ee04e` |

Every prompt carries the same grade — warm ivory, taupe, deep espresso, a
little champagne gold — and the same negatives: no logos, no readable text,
no beauty retouching, no glow.

**Shot 5 is a blank plate, deliberately.** The sign panel is generated empty so
the real wordmark composites onto it. A generated shopfront with generated
lettering is a photograph of a building that is not theirs, and text models
mangle a wordmark anyway. If the actual door gets shot on the phone, use that
instead and the plate goes in the bin — or just cut to the end card, which is
the honest version of this shot.

**Shots 1 and 4 need checking by eye.** They must show the *same* pigmentation
as each other, unchanged. The film's whole argument is that this is managed
rather than cured; two frames where the second looks better is a
before-and-after, whatever the voiceover says over the top of it.
