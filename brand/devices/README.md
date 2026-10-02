# Device renders

Two studio renders from Higgsfield (Nano Banana Pro, 2K), each with a flat
chroma-green screen. `npm run devices` (`scripts/build-devices.mjs`) keys the
green out. It puts each showcase project's real screenshot on the laptop and
cuts the phone out with a clear screen, so live markup can show through it.
Nothing that appears on a screen is generated.

| File | Prompt (aspect) |
| --- | --- |
| `laptop-green.webp` | Premium product photograph of a modern thin silver laptop with no logo, perfectly front-on straight view at eye level, lid open facing the camera, the entire display area is a flat solid pure chroma green (#00FF00) with crisp edges and no reflections, thin black bezel around the screen, centred on a seamless soft light grey studio background (#f3f3f5), gentle natural shadow beneath the base, minimal, clean, high detail, no text, no logo, no watermark. (4:3) |
| `phone-green.webp` | Premium product photograph of a modern smartphone with thin black bezels and rounded corners, no logo, standing upright perfectly front-on facing the camera, the entire screen is a flat solid pure chroma green (#00FF00) edge to edge with a small black pill-shaped camera cut-out at the top, crisp edges, no reflections, centred on a seamless soft light grey studio background (#f3f3f5), gentle natural shadow, minimal, clean, high detail, no text, no logo, no watermark. (3:4) |

Both are kept at 2000px on the long side. A replacement render needs the same
things: a front-on device, a screen that is one flat green to its edges, and a
plain light background.
