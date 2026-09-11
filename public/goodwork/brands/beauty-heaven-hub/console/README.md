# Beauty Heaven Hub — the Content Console

One place the business writes from. An idea goes in, and the carousel, the
blog, the email, the WhatsApp reply, the website answer and the reel come out
in Beauty Heaven's voice, for a person to read and approve.

Live at `/goodwork/brands/beauty-heaven-hub/console/`.

## It is running, not mocked

The writing is real. `api/console.js` calls Claude with the brand profile as
its system prompt and streams the answer back into the panel. There is no
canned copy anywhere in this folder.

Everything else is real too — the approvals queue, the calendar, the email
preview, the brand profile. The one thing that is not yet real enough is
**where it all lives**, which the console says itself under *Where this is
kept*: content is in the browser's localStorage, on one device. That is fine
for one person trying it and not fine for a salon. It needs a database and
logins before a second person can use it, and that is a decision with a cost
rather than something to assume.

## Before it can write anything

Set `ANTHROPIC_API_KEY` on the Vercel project. Without it the endpoint returns
503 and the console says so on screen rather than pretending.

`CONSOLE_EFFORT` is optional and defaults to `medium`.

## How the campaign works, and why

Six channels means six requests, fired together, each streaming into its own
panel. Not one request for the lot:

- Each panel fills in on its own, so the screen is visibly working. That is the
  feature.
- The brand profile is byte-identical across the six and is cached, so five of
  the six pay about a tenth for the part that matters.
- A channel that fails fails alone. One long response that dies at 80% loses
  everything.

The system prompt is the brand and nothing else, which is what makes it
cacheable. The brief goes in the user turn, after the breakpoint.

## The brand profile is the product

`Brand` is not a settings screen. It is the difference between copy that sounds
like Beauty Heaven and copy that sounds like every other salon with a chatbot.
The **what you would never say** list does more work than anything else on it —
it is what keeps "indulge", "pamper" and "elevate your" out of the writing.

The console ships seeded with Beauty Heaven's real profile, taken from
`../BRAND.md` and the premises. An empty brand brain teaches the model nothing.

## Rules the endpoint enforces, not the browser

These are in `api/console.js` so they cannot be edited away in devtools:

- Never invent a price, a qualification, a result, a guarantee or a statistic.
  Where a number would help and none was given, it leaves a `[bracketed gap]`.
- Never claim a medical or clinical outcome.
- British English, and the never-say list.

## What it does not do

It does not publish. Nothing here posts to Instagram, sends an email or
updates the website. Approved means a person read it; the last step is still
someone pressing a button in the CRM. That is on purpose for now — an approval
queue is only worth having if the thing after it is a human.

## Files

| File | What it is |
| --- | --- |
| `index.html` | The six views. |
| `console.css` | Arrangement only — every colour, corner and typeface comes from `../brand.css`. |
| `console.js` | Views, routing, and the streaming campaign. |
| `store.js` | Everything the console knows. The seam: swap `load` and `save` for two fetches and the rest of the app does not change. |
| `../../../../api/console.js` | The only thing that sees the API key. |
