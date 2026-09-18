# Beauty Heaven Hub — email

Four welcome templates, one brand. Each has a `.txt` plain-text alternative,
which every send should carry: it's what a text-only client shows, and a send
without one scores worse with spam filters.

| Template | Plain text | What it is |
| --- | --- | --- |
| `welcome.html` | `welcome.txt` | **Arch** — live. Taupe masthead, arch hero, the two worlds as picture cards, review on the taupe wall, espresso footer. |
| `welcome-maison.html` | `welcome-maison.txt` | **Maison** — centred and printed. No colour band, one arch, an outlined button, hairline rules, the two worlds set as type. |
| `welcome-noir.html` | `welcome-noir.txt` | **Noir** — espresso throughout. The room at night dissolving into the ground, gold hairlines, a solid gold pill. |
| `welcome-lettre.html` | `welcome-lettre.txt` | **Lettre** — no photography. A signed letter, a drawn sprig, the Academy as a P.S. |

The Content Console's Email tab renders these four files directly — pick a
template, type, preview it desktop or phone with sample data on, then copy it
into the CRM with the merge tags intact. The files are the source of truth for
the design; the console only types into them.

## Which one to send

**Arch** is the all-rounder — the place, the two worlds and the proof in one
scroll. It is also the busiest, and it leans on images loading.

**Maison** is the one that reads as expensive rather than busy: space, a narrow
measure, and gold used as a line instead of a slab. Gold as an outline is
quieter than gold as a pill, so watch the click-through if you switch.

**Noir** is for evening and aesthetics — launches, an Academy intake, anything
that should feel like an invitation. Every asset in it has to be made for
espresso, and in return it is the only one that needs no defending against a
client's dark mode.

**Lettre** is for a first enquiry from someone nervous, which the reviews say
is most of them. It is the only one that invites a reply — so it has to be
signed by a real person, and that person has to actually read the replies. It
ships with `[Name]` and `[Role]` as gaps on purpose. If nobody will own it,
send Arch or Maison, which don't pretend.

## Merge tags

Written in GoHighLevel's syntax, identical across all four. If the CRM is
something else, find and replace — they appear nowhere else in the files.

| Tag | What it fills |
| --- | --- |
| `{{contact.first_name}}` | The greeting. |
| `{{custom_values.booking_url}}` | The button, and the same link in the text version. Set once in the CRM so it's never pasted wrong. |
| `{{location.full_address}}` | Footer address — legally required on marketing email. |
| `{{location.phone}}` | Footer, also the `tel:` link. |
| `{{location.email}}` | Footer, also the `mailto:` link. |
| `{{unsubscribe_link}}` | Footer — also legally required. |

**A first name can be missing.** Set a fallback in the CRM (GoHighLevel does
this per custom value) or the greeting reads "hello ,". If that can't be
guaranteed, change the headline to something that doesn't need a name —
"you're very welcome here." works on its own.

## The slots the console fills

Three regions in each file are marked for the console:

```
<!-- bh:slot preheader -->…<!-- bh:endslot -->
<!-- bh:slot headline -->…<!-- bh:endslot -->
<!-- bh:slot body -->…<!-- bh:endslot -->
```

**Don't delete the markers.** They are HTML comments, so every email client
ignores them, and the copied HTML keeps them — which means a template that has
been through the console can go through it again. What's inside them is the
default copy, used whenever the console leaves that field blank.

The console takes its paragraph styling from the `<p>` tags already inside the
body slot, and its bold from the `<b>` inside the headline slot, so the copy
arrives in the template's own type rather than in the console's idea of it.
That means each file stays free to style its own paragraphs — but a body slot
with no `<p>` in it has nothing to copy, so leave at least one.

## What's editable, and what isn't

Every block is marked with an `══` comment. Safe to rewrite:

- **Preheader** — the grey line beside the subject. Under about 90 characters,
  and never a repeat of the subject line.
- **The message** — eyebrow, headline, paragraphs. In Lettre, the whole letter
  and the sign-off.
- **Button label and link.** Change the label in *two* places: the VML block
  for Outlook and the table below it. They're adjacent and commented.
- **The two worlds** — delete the pair (Lettre's is the P.S.) for a
  single-subject email.
- **The review.** Real customer words, with their permission. The one in there
  now is paraphrased and must be replaced before this sends.

Leave alone unless you know email quirks: the table structure, the `mso`
conditional comments, and the footer's address and unsubscribe.

## Why the images look the way they do

Email clients drop `border-radius` and CSS gradients, so the arch, its gold
hairline and Noir's dissolve into the dark are **baked into the artwork**, on
the exact background colour that sits behind them. Swap the photo, keep the
shape — and regenerate rather than hand-crop, or the corners won't match and
you'll get pale squares behind the arch.

```
npm run bh:email-art
```

That script is the source of truth for `maison-arch.jpg`, `noir-hero.jpg` and
`letter-sprig.png`: which photograph, which ground colour, which crop. The
three original arches (`hero-arch.jpg`, `treatments-arch.jpg`,
`academy-arch.jpg`) predate it and are the committed artwork — regenerate them
through the same script if the photography is ever replaced.

Images are served from `goodworkagency.uk`, absolute URLs, because an email
can't carry relative paths. If the brand moves to its own domain, update the
`src` attributes and the `@font-face` URLs.

**It has to read with images off.** Many clients block them by default, so
every image carries real `alt` text and nothing load-bearing lives inside a
picture except the logo.

## Type

Jost reaches Apple Mail and a few others through `@font-face`. Everywhere else
falls back to Century Gothic, then Futura, then Helvetica — the nearest
geometric already on the machine. That's deliberate: the logo is artwork, so
the brand still arrives even in Outlook, which will render Arial and be fine.

## Before it sends

- Replace the paraphrased review with a real one.
- Sign Lettre, or don't send Lettre.
- Set `booking_url` in the CRM.
- Send yourself a test and open it on a phone, in Gmail, and in Outlook if any
  of their list uses it.
- Check the plain-text version goes with it.
