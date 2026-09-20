# Generated imagery for Beauty Heaven — what works

Three rounds of this went badly before one went well. The difference was not
the model. Writing down what actually changed.

## The rule

**Generate people and light. Never generate the place.**

Every usable shot was conditioned on a real photograph of the real room, and
the room was told to stay exactly as it is. Text-only prompts produced generic
salon stock — the precise thing the brand guidelines warn against, arrived at
by a more expensive route. A generated building is worse than a stock photo,
because a stock photo does not claim to be yours.

## The lighting formula

This is the part that made them look expensive, and it is the same in all of
them:

- **One dominant soft source**, placed and named — a window from camera right,
  a lamp low and close, a big source high and left raking across skin.
- **Warm practicals doing the background work.** Lamps, wall lights, a glow
  from a niche. They give depth the key light cannot.
- **No fill on the shadow side.** Say so explicitly. Flat even light is what
  makes salon photography look like a brochure; a face needs a side that falls
  away.
- **Shallow focus, named in lens terms.** 85mm f1.8, 100mm macro f2.8, 35mm f2.
  Models respond to the grammar of a camera better than to adjectives.

## The behaviour rules

- **Nobody looks at the camera. Nobody grins.** Absorbed beats posed every
  time — it is what reads as documentary rather than advertising.
- Describe what a person is *doing*, not what they look like.
- One emotional note per frame: waiting and slightly nervous, concentrating,
  listening.

## Prompt hygiene

Short prompts beat long ones. The first round stacked five negatives per
prompt — *no glow, no retouching, no smoothing, no filter, no beauty light* —
and got the opposite, because diffusion models handle negation badly. State
what you want. Name the room, the light, the lens, the mood. Stop.

## The hard lines

These are not style preferences.

- **No injection imagery.** A needle entering a face advertises a
  prescription-only medicine to the public. Facials, peels, microneedling,
  skin devices, brows, consultations are all fine.
- **No before-and-after, and no implied result.** Treatment in progress only.
  Two frames of the same face where the second looks better is a
  before-and-after whatever the caption says.
- **Generated people are models, not the team and not clients.** Usable for
  lifestyle and website. Never captioned as Jess, as Hollie, or as a real
  client.
- **The premises are never generated.** Photograph them.

## Settings that worked

`nano_banana_pro` at 4k and `seedream_v4_5` at quality *high*, both with the
real room passed as `image_references`. 3712×4608 and up.

Seedream has no 4:5 — it silently substitutes 3:4. Crop, or shoot 4:5 on Nano
Banana when the feed ratio matters.

For video, `cinematic_studio_video_v2` (genre *intimate*, pro, sound off,
cfg 0.35) takes a still and gives back a slow move with a real grade. Two
warnings: it will refuse a submission and hand back a preset recommendation
instead of a job, which you decline by id and resubmit unchanged; and it
ignores `aspect_ratio`, following the orientation of the start image instead.
Shoot portrait if you want portrait.
