# Beauty Heaven Hub — email

`welcome.html` is the template. `welcome.txt` is its plain-text alternative,
which every send should carry: it's what a text-only client shows, and a send
without one scores worse with spam filters.

Built for the Content Console: paste the HTML in, preview desktop and mobile
with sample data on, then copy it into the CRM with the merge tags intact.

## Merge tags

Written in GoHighLevel's syntax. If the CRM is something else, find and
replace — they appear nowhere else in the file.

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

## What's editable, and what isn't

Every block is marked with an `══` comment. Safe to rewrite:

- **Preheader** — the grey line beside the subject. Under about 90 characters,
  and never a repeat of the subject line.
- **The message** — eyebrow, headline, two paragraphs.
- **Button label and link.** Change the label in *two* places: the VML block
  for Outlook and the table below it. They're adjacent and commented.
- **The two worlds** — delete the pair for a single-subject email.
- **The review.** Real customer words, with their permission. The one in there
  now is paraphrased and must be replaced before this sends.

Leave alone unless you know email quirks: the table structure, the `mso`
conditional comments, and the footer's address and unsubscribe.

## Why the images look the way they do

Email clients drop `border-radius`, so the arch and its gold hairline are
**baked into the artwork**, on the exact background colour that sits behind
them. Swap the photo, keep the shape — and regenerate rather than hand-crop,
or the corners won't match and you'll get pale squares behind the arch.

```
cd public/goodwork/brands/beauty-heaven-hub
# hero: ground #F4F0E9 · the two worlds: ground #ECE6DD
node -e "…"   # see the commit that added this folder for the exact call
```

Images are served from `goodworkagency.uk`, absolute URLs, because an email
can't carry relative paths. If the brand moves to its own domain, update the
seven `src` attributes and the three `@font-face` URLs.

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
- Set `booking_url` in the CRM.
- Send yourself a test and open it on a phone, in Gmail, and in Outlook if any
  of their list uses it.
- Check the plain-text version goes with it.
