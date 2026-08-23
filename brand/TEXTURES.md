# Texture prompts

Source prompts for the moving texture layers (`src/components/Texture.jsx`).
Generated stills go in `public/textures/`, then `npm run images` produces the
AVIF/WebP derivatives and the manifest entry the component reads.

## The rules these are written to

**Stills, not video.** The whole site is 381kB on a cold load. One looping
video would be several times that on its own, and the hero already runs a
WebGL field. A still image drifted by CSS reads as a moving texture for ~40kB.

**They must not be more soft gradients.** The site already has the aurora and
the shader field. Another blurred colour wash adds nothing. These need
*material* — grain, fibre, foil, ink, light. Something with structure in it.

**Blend mode decides the brief.** A texture is composited over a ground, so
its own tonality matters more than its prettiness:

| Ground | Blend | The image needs to be |
|---|---|---|
| White sections | `multiply` | Light overall, with darker detail. Anything near-black turns into a stain. |
| Black sections | `screen` | Dark overall, with bright detail. Mid-greys wash the ground out. |
| Either | `overlay` | Mid-grey average, detail both sides. The most forgiving. |

**Never any type.** Generators put fake lettering into abstract work
constantly, and a texture with garbled pseudo-text behind a real headline
looks like a mistake, because it is one.

## Palette to quote in every prompt

```
blue    #3366FF
violet  #7A5CFF
magenta #FF2DB3
coral   #FF6B5E
```

Gradient order across the brand is blue → violet → magenta → coral.

## The set

Square (1:1) unless noted — the component covers and oversizes, so aspect
ratio barely matters, but square wastes the fewest pixels.

### 1. Iridescent foil — for dark blocks (`screen`, opacity ~0.45)

> Extreme macro photograph of iridescent holographic foil, crumpled and
> catching light. Deep near-black background with bright specular highlights in
> electric blue #3366FF, violet #7A5CFF and hot magenta #FF2DB3. Sharp creases,
> real optical caustics, fine surface grain. Dark overall with the colour only
> in the highlights. No text, no letters, no logos, no faces, no objects.

Where: behind the disciplines block, and the Content Console dark section.

### 2. Ink in water — for white sections (`multiply`, opacity ~0.35)

> High-speed photograph of coloured ink diffusing through clear water against a
> white background. Blue #3366FF and magenta #FF2DB3 ink blooming into fine
> tendrils and filaments. Bright, high-key, mostly white with the colour
> concentrated in thin structures. Crisp focus, visible fluid detail. No text,
> no letters, no logos, no hands, no containers.

Where: behind the scope builder, and the Work hero.

### 3. Long-exposure light trails — for dark blocks (`screen`, opacity ~0.4)

> Long-exposure night photograph of light trails, abstract. Pure black
> background with clean continuous streaks of blue #3366FF, violet #7A5CFF and
> coral #FF6B5E sweeping in long curves. Motion blur, slight chromatic
> aberration, film grain. Dark, with light only in the trails themselves. No
> text, no vehicles, no buildings, no people.

Where: behind the horizontal work rail.

### 4. Risograph grain — an overlay for anywhere (`overlay`, opacity ~0.25)

> Extreme close-up of a risograph print on uncoated paper. Visible paper fibre,
> ink misregistration and halftone dot structure in blue #3366FF and magenta
> #FF2DB3. Flat mid-grey average tone, no strong light or shade. Analogue,
> tactile, slightly imperfect. No text, no letters, no images, no illustration.

Where: sitewide, very low opacity, to stop large flat areas looking digital.

### 5. Brushed anodised metal — for the footer (`screen`, opacity ~0.3)

> Macro photograph of brushed anodised aluminium at a shallow angle. Dark
> charcoal surface with fine parallel brush lines and a thin iridescent sheen
> pulling blue #3366FF into violet #7A5CFF across the grain. Directional,
> industrial, precise. No text, no logos, no reflections of objects.

Where: the footer, and the "How we work" section.

## Dropping them in

1. Save as `public/textures/<name>.jpg` — the source can be large, the
   pipeline handles it.
2. `npm run images`
3. Use it:

```jsx
<section className="gw-section gw-dark" style={{ position: "relative" }}>
  <Texture src="/textures/foil.jpg" variant="drift" blend="screen" opacity={0.45} />
  <div className="gw-container"> … </div>
</section>
```

The parent needs `position: relative`, or the texture escapes to the nearest
positioned ancestor and covers the wrong thing.

## After adding any texture

Re-run the checks — a texture sits *behind live text*, so it is exactly the
kind of change that quietly breaks contrast:

- the contrast audit across every page
- the overflow sweep at 390 / 768 / 1440
- frame rate on the pages you added it to

A texture that costs a page its contrast is a texture that comes back out.
