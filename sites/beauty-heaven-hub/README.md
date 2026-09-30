# Beauty Heaven Hub website

The real website for beautyheavenhub.co. Static, no framework, built from Phorest's own service export so the menu, prices and
durations are the salon's, not retyped.

```
node sites/beauty-heaven-hub/build.mjs     # writes public/ and CONTENT-TODO.md
```

**Menu data.** On Vercel the build reads the live menu from Phorest (credentials are the project's sensitive environment
variables), so every deploy has current prices, and a failed Phorest read fails the deploy rather than shipping stale data.
Anywhere without the credentials it falls back to `docs/beauty-heaven-hub/services-master.csv`. The Academy page reads the
separate "Beauty Heaven Academy" branch when live.

- `data/site.json`: phone, email, WhatsApp, address, hours, links, and switches (`launched`, `showPrescriptionOnlyPrices`, `hideServices`).
- `data/groups.json`: how Phorest's 42 categories become the seven menu pages, with each category's Phorest booking link id.
- **The look is the approved mock-up** (`public/goodwork/brands/beauty-heaven-hub/preview-8f3ac21d.html`). The home page is that file,
  rewired by `home()` in build.mjs (asset paths, real links, and the few claims we can't stand behind). Its styles and script are
  extracted to `mockup.css` and `mockup.js` and shared by every page. Edit the mock-up, then rebuild; if an edit breaks one of the
  rewiring steps, the build stops and names it.
- `src/pages.css`: the inner pages (menus, chips, visit, notes), written in the mock-up's own vocabulary.
- `CONTENT-TODO.md`: everything still to confirm. Each shows as a yellow note on the draft pages. With `launched: true` the build refuses to run while any remain.

**Preview:** https://beauty-heaven-hub.vercel.app (Vercel project `beauty-heaven-hub`, noindex, public so the owners can view it on their phones). It
was deployed by hand from this branch; pushes to other branches make separate preview URLs, and merging to `main` updates it.

**Deploy:** its own Vercel project, root directory `sites/beauty-heaven-hub`, build command `node build.mjs`, output `public`. `vercel.json` sends
`noindex` on every page; remove that header, and set `launched: true`, on launch day. Point the domain from GoDaddy only after saving the
current DNS records (the salon's email runs on Microsoft 365). Redirect the old Wix page addresses.

**Menu rules:** only services Phorest shows online, with a price, and not student-practical (model) bookings. Prescription-only
categories are listed without prices. Sunbeds are flagged for a keep-or-drop decision. Weight-loss injections and one service
name are held back until checked.
