# GOOD WORK. — logo sting

A 3.5s animated logo lockup with a genuinely transparent background, for
dropping over footage, on top of a hero video, or as an end card.

```bash
npm run check                     # lint + runtime + layout + motion
npx hyperframes preview           # scrub it in the browser
```

## Rendering

```bash
# editor master (ProRes 4444, real alpha plane — ~170 MB)
npx hyperframes render . --format mov -q high -o ./renders/goodwork-sting-alpha.mov

# dark-footage variant
npx hyperframes render . --format mov -q high \
  --variables '{"onDark":true}' -o ./renders/goodwork-sting-ondark.mov
```

**The `--format webm` path does not carry alpha.** It reports `needsAlpha: true`
and then encodes `yuv420p`, so the background bakes to black. Go via the PNG
sequence instead — that path writes true RGBA:

```bash
npx hyperframes render . --format png-sequence -o ./renders/frames
ffmpeg -framerate 30 -i renders/frames/frame_%06d.png \
  -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 30 -auto-alt-ref 0 -row-mt 1 \
  renders/goodwork-sting-alpha.webm
```

`-auto-alt-ref 0` is required; libvpx-vp9 silently drops alpha without it.

Note that `ffprobe` reports `pix_fmt=yuv420p` on a working alpha WebM — VP9
keeps alpha in a side channel, and ffmpeg can't round-trip it. Check
`stream_tags=alpha_mode` (should be `1`) and confirm in a browser, not in ffprobe.

## Two silver variants

The descriptor's silver has to invert, exactly as in `brand/`: the on-light
silver is deliberately dark so it stays legible, which makes it invisible over
dark footage. `--variables '{"onDark":true}'` switches it to the light silver.

- `goodwork-sting-alpha.*` — dark silver, for light or mid footage
- `goodwork-sting-ondark.*` — light silver, for dark footage

## Design notes

The motion is the website's own, not a new language: the wordmark rises from
behind its own baseline like the site's headlines, and the brand gradient
resolves onto it. Both sweeps animate *into* the canonical mark rather than
past it, so the held final frame is the real logo — blue through to coral
across the full wordmark — and not a mid-gradient state.

The wordmark is one text element on purpose. Splitting it into per-word spans
to stagger them gives each word its own full rainbow, which reads visibly
off-brand against the site's single continuous ramp.

Fonts are local subsets and GSAP is vendored into `assets/` — a render must
not depend on the network, and the CDN is blocked here anyway.
