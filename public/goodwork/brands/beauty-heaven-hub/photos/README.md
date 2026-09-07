# Photography

Drop the real photographs in here under these names (jpg or png, the slot takes whichever is there) and the prototype picks
them up with no other change. While a file is missing, its slot shows the
labelled placeholder instead.

| File | Slot | What it is |
| --- | --- | --- |
| `reception-portrait.png` | Story arch, first beat | Reception: the gold desk, the logo on the taupe wall, herringbone ✅ supplied |
| `reception-wide.png` | Story arch, third beat · The Hub gallery | Reception, wide ✅ supplied |
| `salon-mirrors.png` | Story arch · Treatments doorway · gallery | The salon floor and its arched mirrors ✅ supplied |
| `lounge-wings.png` | Story arch · Academy doorway · gallery | The lounge, the neon wings and halo ✅ supplied |
| `treatment-room.jpg` | Story arch, third beat · Treatments doorway · gallery | A treatment room: ring pendants, the stone wings ✅ supplied — cropped at the bottom to remove a social-post overlay; send the original file when you have it |
| `treatment-macro.jpg` | *(spare)* | A macro of a treatment in progress — still to shoot, and worth having |
| `academy-floor.jpg` | The Hub gallery | Students, models, teaching — still to shoot. Until it exists the Academy doorway uses the lounge and its wings. |
| `jessica.jpg` | Team portrait (3:4) | Jessica |
| `hollie.jpg` | Team portrait (3:4) | Hollie |

**Send the originals when you can.** The four supplied shots are 370–630px
wide, which is what a social post exports at; the site serves them at their
native size and they go soft in the big arches on a good screen. A photo
straight off the camera or phone (2000px+) would fill them properly. The
build makes the responsive WebP copies in `derived/` — regenerate them
after replacing any file.

Every slot is an arch that crops with `object-fit: cover`, so portrait
orientation works best; a landscape shot is fine in the rail and is cropped
to the centre. Any size — a phone photo is enough for the prototype.

The client's logo is `../logo/original.png` — the master for print. The
generated marks alongside it are matched to it.
