# Beauty Heaven Hub website

The real website for beautyheavenhub.co. Static, no framework, built from Phorest's own service export so the menu, prices and
durations are the salon's, not retyped.

```
node sites/beauty-heaven-hub/build.mjs     # writes public/ and CONTENT-TODO.md
```

- `data/site.json`: phone, email, WhatsApp, address, hours, links, and switches (`launched`, `showPrescriptionOnlyPrices`, `hideServices`).
- `data/groups.json`: how Phorest's 42 categories become the seven menu pages, with each category's Phorest booking link id.
- `src/site.css`: layout. Colours, type and the logo come from the brand kit (`public/goodwork/brands/beauty-heaven-hub/brand.css`), copied in at build.
- `CONTENT-TODO.md`: everything still to confirm. Each shows as a yellow note on the draft pages. With `launched: true` the build refuses to run while any remain.

**Deploy:** its own Vercel project, root directory `sites/beauty-heaven-hub`, no build command, output `public`. `vercel.json` sends
`noindex` on every page; remove that header, and set `launched: true`, on launch day. Point the domain from GoDaddy only after saving the
current DNS records (the salon's email runs on Microsoft 365). Redirect the old Wix page addresses.

**Menu rules:** only services Phorest shows online, with a price, and not student-practical (model) bookings. Prescription-only
categories are listed without prices. Sunbeds are flagged for a keep-or-drop decision. Weight-loss injections and one service
name are held back until checked.
