# Pigmentation 30s — edit decision list, v1

Assembled 11 Sep. 1080×1920, 25fps, 29.24s. Silent — the VO is laid on separately.
Every frame except the two slates is a real photograph of the salon.

| # | In | Dur | Shot | Move | Line it sits under |
|---|---|---|---|---|---|
| 1 | 00:00.00 | 3.00 | **slate — bare skin, to shoot** | hold | "You can't scrub pigmentation away." |
| 2 | 00:03.00 | 3.00 | Brass trolley, IMAGE SPF 50 | push in | "It's sun…" |
| 3 | 00:06.00 | 3.00 | AlumierMD tray, marble | pull out | "…hormones, or injury. Each behaves differently." |
| 4 | 00:09.00 | 3.50 | Bouclé waiting chairs | push in | "So we don't start with products." |
| 5 | 00:12.50 | 3.50 | Chair at the frosted window | pull out | "We start with a consultation." |
| 6 | 00:16.00 | 2.50 | Skin room, marble counter | push in | Hollie: "We treat it over time…" |
| 7 | 00:18.50 | 2.50 | Wavy-mirror treatment room | pull out | "…peels. It's slow." |
| 8 | 00:21.00 | 3.00 | **slate — bare skin, to shoot** | hold | "We manage it. We don't cure it." |
| 9 | 00:24.00 | 5.15 | End card | hold | "Beauty Heaven Hub. Consultations with Hollie…" |

## Why these shots

Beat 2 lands "sun" on a shelf of factor 50 — the salon's own answer, in shot,
without a word of voiceover doing the work. Beat 3's Alumier card reads
*Radiant TXA — Discolouration + Ageing*, which is the film's thesis printed on
the client's own counter. Neither needed staging; they were already there.

Beats 4 and 5 are deliberately empty rooms. The line is that nobody is sold to
before they are listened to, and a room with nobody performing in it says that
better than a staged consultation would.

## The two slates

Frames 1 and 8 are the only things not yet shot, and they are the same setup
twice: a close-up of real skin with real pigmentation. Shoot both in one go by
the **frosted window in the Tesla room** — full height, soft, directional, the
best light in the building and the only one that isn't a downlight.

The second must show the **same** marks as the first, unchanged. Only the light
moves. A second frame that looks better is a before-and-after, and this film is
explicitly about not promising one.

Signed release from whoever sits for it.

## Not in this cut, on purpose

- **The sunbeds.** The script's own argument is "it's either sun, hormones, or
  injury". A sunbed in a pigmentation film contradicts the thesis in the middle
  of stating it.
- **The Jalupro boxes** on the lower shelf of the trolley — an injectable, and
  injectables in a public ad pull you back under the prescription-medicine
  rules. Frame 2 is cropped to the top two shelves.

## To finish

1. Shoot the two skin frames; they drop straight into slots 1 and 8.
2. Lay the 29.15s VO underneath. The cut was timed to it, not the other way round.
3. The end card still reads `[street]`.
4. Reshoot the reception wordmark wall at full resolution — the file in
   `../photos/` is 630px and goes soft. That wall is the real final frame if you
   would rather end on the sign than on a card.

---

# v2 — the rooms put through Higgsfield

Six real photographs of the salon taken through `cinematic_studio_video_v2`
(genre *intimate*, pro, sound off, cfg 0.35) as 5-second moves. The room is
the real room in every one; the model was asked for camera and grade only —
same furniture, same products, same walls, nobody entering frame.

| Beat | Shot | Move | Job |
|---|---|---|---|
| 2 | SPF 50 on the brass trolley | slow push in | `218c6f7d` |
| 3 | AlumierMD tray | slow drift | `e2928c01` |
| 4 | Bouclé waiting chairs | slow push in | `6364ca33` |
| 5 | Chair at the frosted window | slow pull back | `f96b3d9b` |
| 6 | Skin room, marble counter | slow push in | `42b10930` |
| 7 | Wavy-mirror treatment room | slow push in | `81c0cf78` |

Three of the six were refused on first submission with a preset
recommendation (*IN THE DARK*) instead of a job. Declining it by id and
resubmitting went through unchanged. Worth knowing: the API will substitute
a creative decision for yours unless you say no to it explicitly.

## The aspect ratio problem

`aspect_ratio: "9:16"` was accepted, echoed back in the job params as
768×1344, and then ignored. Five of the six clips came out **1920×1080
landscape** — the model followed the orientation of the start image, and
five of the six source photographs are landscape. Only the frosted-window
shot, which was photographed portrait, came back portrait.

No rotation metadata, so this is real and not a reader artefact.

Cropping a 16:9 frame to 9:16 throws away about two thirds of the picture and
wrecks compositions that were framed wide on purpose. So v2 is cut **16:9**,
which costs nothing and shows the grade and the moves honestly.

Three ways to a vertical cut, in the order they are worth doing:

1. **Reshoot the six rooms holding the phone upright.** Free, ten minutes,
   and the frame is composed for the format instead of rescued into it. Then
   the same six generations run again from portrait sources.
2. **`reframe` the five landscape clips** — 48 credits each, 240 total. It
   expands rather than crops, so the composition survives, but the new edges
   are invented.
3. **Keep it 16:9** and run it as a website and YouTube film rather than a
   Reel.
