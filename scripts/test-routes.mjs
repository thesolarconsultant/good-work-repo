// Crawls the built site with headless Chromium and checks every route at
// three breakpoints: no console errors, no horizontal overflow, no broken
// internal links, a real <title>. Screenshots land in the directory named by
// GW_SHOTS (default: .test-shots/, gitignored).
//
//   npm run build && npm run test:routes
//
// Serves dist/ itself with the same SPA fallback the hosts use, and answers
// /api/* with 503 so forms exercise their honest "not configured" path.

import { createServer } from "node:http";
import { readFileSync, existsSync, statSync, mkdirSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  ({ chromium } = require("/opt/node22/lib/node_modules/playwright"));
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const shots = process.env.GW_SHOTS || join(root, ".test-shots");
mkdirSync(shots, { recursive: true });

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".avif": "image/avif", ".woff2": "font/woff2", ".woff": "font/woff", ".txt": "text/plain", ".xml": "application/xml", ".webm": "video/webm" };

const server = createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname.startsWith("/api/")) {
    res.writeHead(503, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not configured in the test server." }));
    return;
  }
  let file = join(dist, decodeURIComponent(url.pathname));
  if (!existsSync(file) || statSync(file).isDirectory()) {
    const index = join(file, "index.html");
    file = existsSync(index) ? index : join(dist, "index.html");
  }
  res.writeHead(200, { "Content-Type": MIME[extname(file)] || "application/octet-stream" });
  res.end(readFileSync(file));
});

const ROUTES = [
  "/", "/library", "/library?category=heroes", "/library?type=template", "/library/shimmer", "/library/pricingtiers", "/library/paste-and-go-starter", "/library/content-console",
  "/studio", "/systems", "/systems/content-console", "/systems/whatsapp-bot", "/systems/voice-agent", "/systems/brand-guide", "/systems/automations",
  "/services", "/built-by-goodwork", "/crm", "/agency", "/managed", "/pricing", "/showcase",
  "/learn", "/learn/category/content-systems", "/learn/build-a-site-from-the-engine",
  "/docs", "/docs/getting-started", "/docs/brand-tokens", "/login", "/dashboard", "/welcome", "/contact", "/contact?topic=crm",
  "/legal/licence", "/legal/terms", "/legal/refunds", "/legal/privacy", "/legal/cookies", "/legal/acceptable-use",
  "/work", "/case-studies", "/content-console", "/pitch", "/this-page-does-not-exist",
];
// GW_VIEWPORTS=desktop (or a comma list) narrows a local run; CI runs all three.
const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
].filter((v) => !process.env.GW_VIEWPORTS || process.env.GW_VIEWPORTS.split(",").includes(v.name));

await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}`;
console.log(`serving dist at ${base}`);

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
const problems = [];
const seenLinks = new Set();

for (const vp of VIEWPORTS) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));

  for (const route of ROUTES) {
    errors.length = 0;
    await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
    // Walk the page so every scroll-reveal has entered the viewport once, the
    // way a reader would, then return to the top for the capture.
    if (route !== "/pitch") {
      await page.evaluate(async () => {
        // The site scrolls smoothly; the walk must not, or the observers see
        // an animation in progress rather than each position.
        document.documentElement.style.scrollBehavior = "auto";
        const step = Math.max(300, Math.floor(window.innerHeight * 0.8));
        for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
          window.scrollTo({ top: y, behavior: "instant" });
          // Two painted frames at each stop, not a fixed delay: observers only
          // run on a rendering opportunity, and a busy frame can outlast 60ms.
          await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 40))));
        }
        window.scrollTo({ top: 0, behavior: "instant" });
        await new Promise((r) => setTimeout(r, 100));
        document.documentElement.style.scrollBehavior = "";
      });
      await page.waitForFunction(() => window.scrollY === 0);
    }
    await page.waitForTimeout(450);
    const title = await page.title();
    // The body clips horizontal overflow, which hides it from the document's
    // scrollWidth but not from the reader: text past the edge is simply cut
    // off. The body's own scrollWidth still measures it.
    const overflow = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - document.documentElement.clientWidth);
    const links = await page.$$eval('a[href^="/"]', (as) => as.map((a) => a.getAttribute("href")));
    for (const l of links) seenLinks.add(l.split("#")[0].split("?")[0]);
    const label = `${vp.name} ${route}`;
    if (!title) problems.push(`${label}: empty <title>`);
    if (route === "/this-page-does-not-exist" ? !/not found/i.test(title) : /not found/i.test(title)) problems.push(`${label}: unexpected title "${title}"`);
    if (overflow > 1) problems.push(`${label}: horizontal overflow ${overflow}px`);
    // Preview iframes with sandboxed scripts can log their own noise; only our
    // document's errors count.
    // Two known, harmless sources are excluded: the sandbox's TLS proxy
    // rejecting Google Fonts inside the starter template's iframe (fine in
    // production), and this test server's deliberate 503 for /api/*.
    const own = errors.filter((e) => !/srcdoc|about:srcdoc|ERR_CERT_AUTHORITY_INVALID|fonts\.googleapis|status of 503/.test(e));
    if (own.length) problems.push(`${label}: console errors: ${own.slice(0, 3).join(" | ")}`);
    const safe = route.replace(/[^a-z0-9]+/gi, "_") || "home";
    await page.screenshot({ path: join(shots, `${vp.name}-${safe}.png`), fullPage: route !== "/pitch" });
    process.stdout.write(`${overflow > 1 || own.length ? "✗" : "✓"} ${label}  (${title.slice(0, 60)})\n`);
  }

  // Mobile drawer and a dropdown, exercised once each.
  if (vp.name === "mobile") {
    await page.goto(`${base}/`, { waitUntil: "networkidle" });
    await page.click('button[aria-controls="gw-drawer"]');
    await page.waitForSelector("#gw-drawer");
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(shots, "mobile-drawer.png") });
    const drawerOnTop = await page.evaluate(() => {
      const a = document.querySelector("#gw-drawer a");
      const r = a.getBoundingClientRect();
      return Boolean(document.elementFromPoint(r.left + 8, r.top + 8)?.closest("#gw-drawer"));
    });
    if (!drawerOnTop) problems.push("mobile drawer: page content paints above the drawer");
    const drawerLinks = await page.$$eval("#gw-drawer a", (as) => as.length);
    if (drawerLinks < 10) problems.push(`mobile drawer: only ${drawerLinks} links`);
    await page.keyboard.press("Escape");
    // The Library's sidebar becomes a side sheet on phones.
    await page.goto(`${base}/library`, { waitUntil: "networkidle" });
    await page.click("text=Browse the Library");
    await page.waitForSelector(".gw-sheet--side");
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(shots, "mobile-library-browse.png") });
    const sheetLinks = await page.$$eval(".gw-sheet--side a", (as) => as.length);
    if (sheetLinks < 150) problems.push(`library browse sheet: only ${sheetLinks} links`);
    await page.click('.gw-sheet--side a[href="/library/shimmer"]');
    await page.waitForURL("**/library/shimmer", { timeout: 5000 }).catch(() => problems.push("library browse sheet: tapping an item did not open it"));
    if (await page.$(".gw-sheet--side")) problems.push("library browse sheet: still open after navigating");
  }
  if (vp.name === "desktop") {
    await page.goto(`${base}/`, { waitUntil: "networkidle" });
    await page.hover('button[aria-controls="gw-menu-Library"]');
    await page.waitForSelector("#gw-menu-Library");
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(shots, "desktop-menu-products.png") });
    const menuOnTop = await page.evaluate(() => {
      const a = document.querySelector("#gw-menu-Library a");
      const r = a.getBoundingClientRect();
      return Boolean(document.elementFromPoint(r.left + 8, r.top + 8)?.closest("#gw-menu-Library"));
    });
    if (!menuOnTop) problems.push("products menu: page content paints above the dropdown");
    // Keyboard: Escape closes the menu and returns focus to its button.
    await page.keyboard.press("Escape");
    const menuGone = await page.$("#gw-menu-Library");
    if (menuGone) problems.push("products menu: Escape did not close it");
    // A form's honest failure path against the 503 API, step by step: a
    // pointer pick on the topic moves on by itself, Enter moves on from a
    // field, and only the review sends.
    await page.goto(`${base}/contact`, { waitUntil: "networkidle" });
    await page.click(".gw-flow__opt:has-text('Goodwork Library')");
    await page.waitForSelector('textarea[name="message"]', { timeout: 5000 });
    await page.fill('textarea[name="message"]', "Checking the honest failure state.");
    await page.click('.gw-flow button[type="submit"]');
    await page.waitForSelector('input[name="name"]', { timeout: 5000 });
    await page.fill('input[name="name"]', "Test Person");
    await page.fill('input[name="email"]', "test@example.com");
    await page.press('input[name="email"]', "Enter");
    await page.click(".gw-flow .gw-btn:has-text('Send')");
    await page.waitForSelector(".gw-alert", { timeout: 5000 });
    const alertText = await page.$eval(".gw-alert", (el) => el.textContent);
    if (!/didn't send/i.test(alertText)) problems.push(`contact form: unexpected alert "${alertText.slice(0, 80)}"`);
    await page.screenshot({ path: join(shots, "desktop-contact-failed.png"), fullPage: true });
    // Checkout unavailable state.
    await page.goto(`${base}/library`, { waitUntil: "networkidle" });
    await page.click("text=Get Library Access — £280 >> nth=-1");
    await page.waitForSelector("text=Checkout not switched on yet", { timeout: 5000 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: join(shots, "desktop-checkout-unavailable.png") });
    // The sidebar's category links filter the grid through the URL.
    await page.goto(`${base}/library`, { waitUntil: "networkidle" });
    await page.click('.gw-docs__side a.gw-side__title[href="/library?category=heroes"]');
    await page.waitForTimeout(400);
    if (!page.url().includes("category=heroes")) problems.push("library filters: category chip did not update the URL");
    const heroCount = await page.$$eval(".gw-lib-card", (els) => els.length);
    if (heroCount !== 9) problems.push(`library filters: expected 9 hero cards, saw ${heroCount}`);
    // Search combines with the category: "pricing" inside Heroes is the empty
    // state, and clearing brings the results back.
    await page.fill('input[type="search"]', "pricing");
    await page.waitForTimeout(600);
    const emptyState = await page.$("text=Nothing matches those filters.");
    if (!emptyState) problems.push("library search: expected the empty state for 'pricing' within Heroes");
    await page.click("text=Clear filters");
    await page.waitForTimeout(500);
    const restored = await page.$$eval(".gw-lib-card", (els) => els.length);
    if (restored < 20) problems.push(`library search: clearing filters left only ${restored} cards`);
    await page.fill('input[type="search"]', "pricing");
    await page.waitForTimeout(600);
    const searchCount = await page.$$eval(".gw-lib-card", (els) => els.length);
    if (searchCount < 3) problems.push(`library search: expected pricing results across the whole library, saw ${searchCount}`);
    // An item page for a visitor: Preview/Code tabs, arrow keys switch them,
    // the Code tab shows an excerpt and how to get the rest, and the rail's
    // "On this page" lists the sections.
    await page.goto(`${base}/library/pricingtiers`, { waitUntil: "networkidle" });
    await page.focus("#tab-preview");
    await page.keyboard.press("ArrowRight");
    const codeSelected = await page.getAttribute("#tab-code", "aria-selected");
    if (codeSelected !== "true") problems.push("library item: ArrowRight did not move to the Code tab");
    if (!(await page.$(".gw-code--locked .gw-code__lock"))) problems.push("library item: a visitor should see the excerpt with how to get the full source");
    const tocLinks = await page.$$eval(".gw-toc a", (as) => as.map((a) => a.getAttribute("href")));
    for (const id of ["#preview", "#installation", "#tokens", "#details", "#licence", "#related"]) if (!tocLinks.includes(id)) problems.push(`library item: "On this page" is missing ${id}`);
    for (const id of tocLinks) if (!(await page.$(id))) problems.push(`library item: "On this page" links to ${id}, which is not on the page`);
    const tokenRows = await page.$$eval("#tokens ~ .gw-table-wrap tbody tr, #tokens + * tbody tr", (r) => r.length).catch(() => 0);
    const tokenRows2 = await page.$$eval(".gw-table tbody tr", (r) => r.length);
    if (Math.max(tokenRows, tokenRows2) < 3) problems.push(`library item: expected the brand tokens table, saw ${tokenRows2} rows`);
    if (!(await page.$('.gw-pager a[rel="next"]'))) problems.push("library item: no next link in the pager");
    await page.screenshot({ path: join(shots, "desktop-library-item-code.png") });
    // Live previews actually mount sandboxed iframes with the snippet inside.
    await page.goto(`${base}/library?category=buttons`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    const frames = await page.$$eval(".gw-lib-card__preview iframe", (els) => els.map((f) => ({ sandbox: f.getAttribute("sandbox"), hasDoc: (f.getAttribute("srcdoc") || "").length > 100 })));
    if (frames.length < 3) problems.push(`library previews: only ${frames.length} iframes mounted for buttons`);
    if (frames.some((f) => f.sandbox !== "allow-scripts")) problems.push("library previews: an iframe is missing sandbox=allow-scripts");
    await page.screenshot({ path: join(shots, "desktop-library-buttons.png") });

    // Signed-in states, with /api/access answered by a mock session (the real
    // endpoint is covered by test-api). The marker cookie tells the app to
    // ask; the mock answers as the server would for a Library key.
    const SESSION = {
      ok: true,
      configured: true,
      user: { id: "abc123def456", name: "test@example.com" },
      entitlements: [{ productId: "library", source: "access-key" }],
      downloads: [{ product: "library", name: "Goodwork Library", version: "1.0.0", updated: "2026-09-26", items: 166, filename: "goodwork-library-1.0.0.zip", href: "/api/download?product=library", note: "Every component as a paste-ready file." }],
      pending: [],
    };
    const signedIn = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await signedIn.addCookies([{ name: "gw_signed_in", value: "1", domain: "localhost", path: "/" }]);
    await signedIn.route("**/api/access", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(SESSION) }));
    const sp = await signedIn.newPage();
    const spErrors = [];
    sp.on("pageerror", (e) => spErrors.push(e.message));
    // Reveal-on-scroll content only paints once scrolled to, so walk the page
    // before a full-page screenshot, as the main crawl does.
    const walk = async (pg) => {
      await pg.evaluate(async () => {
        document.documentElement.style.scrollBehavior = "auto";
        for (let y = 0; y < document.documentElement.scrollHeight; y += 600) {
          window.scrollTo(0, y);
          await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 40))));
        }
        window.scrollTo(0, 0);
      });
      await pg.waitForTimeout(400);
    };
    await sp.goto(`${base}/dashboard`, { waitUntil: "networkidle" });
    const dashLink = await sp.waitForSelector('a[href="/api/download?product=library"]', { timeout: 5000 }).catch(() => null);
    if (!dashLink) problems.push("dashboard: a signed-in session did not render the download link");
    const navLabel = await sp.$eval(".gw-nav__signin", (el) => el.textContent.trim()).catch(() => "");
    if (navLabel !== "Dashboard") problems.push(`nav: expected the sign-in link to read "Dashboard" when signed in, saw "${navLabel}"`);
    await walk(sp);
    await sp.screenshot({ path: join(shots, "desktop-dashboard-signed-in.png"), fullPage: true });
    // navbar is a 20-line snippet, so the 12-line excerpt and the whole thing
    // differ. The source sits behind the Code tab, as in component docs.
    await sp.goto(`${base}/library/navbar`, { waitUntil: "networkidle" });
    await sp.click('role=tab[name="Code"]').catch(() => problems.push("library item: no Code tab"));
    const copyBtn = await sp.waitForSelector(".gw-code__copy", { timeout: 5000 }).catch(() => null);
    if (!copyBtn) problems.push("library item: a signed-in session did not show the full source with Copy code");
    if (!(await sp.$('a[href="/api/download?product=library"]'))) problems.push("library item: a signed-in session did not show the bundle download");
    const navbarCode = JSON.parse(readFileSync(join(dist, "library", "items", "navbar.json"), "utf8")).code;
    const shownCode = await sp.$eval(".gw-code code", (el) => el.textContent).catch(() => "");
    if (shownCode !== navbarCode) problems.push(`library item: expected the whole snippet when signed in (${navbarCode.split("\n").length} lines), saw ${shownCode.split("\n").length} lines`);
    await walk(sp);
    await sp.screenshot({ path: join(shots, "desktop-library-item-signed-in.png"), fullPage: true });
    if (spErrors.length) problems.push(`signed-in pages: ${spErrors.slice(0, 2).join(" | ")}`);
    await signedIn.close();

    // The sign-in form: the server takes keys (401 with no cookie), a key is
    // entered, the POST succeeds and the dashboard follows.
    const signingIn = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    let posted = null;
    await signingIn.route("**/api/access", (route) => {
      const req = route.request();
      if (req.method() === "POST") {
        posted = JSON.parse(req.postData() || "{}");
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(SESSION) });
      }
      return route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ ok: false, configured: true }) });
    });
    const lp = await signingIn.newPage();
    await lp.goto(`${base}/login?next=/dashboard`, { waitUntil: "networkidle" });
    const keyInput = await lp.waitForSelector('input[name="key"]', { timeout: 5000 }).catch(() => null);
    if (!keyInput) problems.push("login: expected the access-key form when the server takes keys");
    else {
      await lp.waitForTimeout(600);
      await lp.screenshot({ path: join(shots, "desktop-login-form.png"), fullPage: true });
      await lp.fill('input[name="key"]', "gw_test_key_0123456789");
      await lp.click('button[type="submit"]');
      await lp.waitForURL("**/dashboard", { timeout: 5000 }).catch(() => problems.push("login: submitting a key did not reach the dashboard"));
      if (posted?.key !== "gw_test_key_0123456789") problems.push("login: the key was not posted to /api/access as typed");
    }
    await signingIn.close();

    // After paying: /welcome claims the purchase with /api/claim, mocked here
    // (the real endpoint is covered by test-api). A payment still clearing
    // says so and offers a retry; a confirmed one shows the key, a working
    // Copy button and the download. The old success URL forwards here.
    const KEY = "gw-lib-0123456789abcdef-AbCdEfGhIjKlMnOpQrStUv";
    const welcome = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await welcome.grantPermissions(["clipboard-read", "clipboard-write"], { origin: base });
    let claims = 0;
    let claimStatus = 409;
    await welcome.route("**/api/claim", (route) => {
      claims++;
      const body = claimStatus === 200
        ? { ok: true, key: KEY, product: "library", products: ["library"], email: "jo@example.com", name: "Jo Buyer" }
        : { ok: false, pending: true, error: "Your payment hasn't been confirmed yet." };
      return route.fulfill({ status: claimStatus, contentType: "application/json", body: JSON.stringify(body) });
    });
    const wp = await welcome.newPage();
    const wpErrors = [];
    wp.on("pageerror", (e) => wpErrors.push(e.message));
    await wp.goto(`${base}/welcome?session_id=cs_test_a1b2c3d4e5f6g7h8`, { waitUntil: "networkidle" });
    if (!(await wp.waitForSelector("text=Still confirming", { timeout: 5000 }).catch(() => null))) problems.push("welcome: a payment still clearing should say so");
    claimStatus = 200;
    await wp.click("text=Check again");
    const keyBox = await wp.waitForSelector(".gw-keybox__key", { timeout: 5000 }).catch(() => null);
    if (!keyBox) problems.push("welcome: a confirmed purchase did not show the key");
    else {
      if ((await keyBox.textContent()).trim() !== KEY) problems.push("welcome: the key shown is not the one the server issued");
      await wp.click("text=Copy key");
      if ((await wp.evaluate(() => navigator.clipboard.readText()).catch(() => "")) !== KEY) problems.push("welcome: Copy key did not copy the key");
      if (!(await wp.$('a[href="/api/download?product=library"]'))) problems.push("welcome: no Library download after the purchase");
      await walk(wp);
      await wp.screenshot({ path: join(shots, "desktop-welcome.png"), fullPage: true });
    }
    if (claims !== 2) problems.push(`welcome: expected one claim on load and one on "Check again", saw ${claims}`);
    await wp.goto(`${base}/login?purchase=library&session_id=cs_test_legacy0123456`, { waitUntil: "networkidle" });
    if (!wp.url().endsWith("/welcome?session_id=cs_test_legacy0123456")) problems.push(`login: a checkout return should forward to /welcome, went to ${wp.url()}`);
    if (wpErrors.length) problems.push(`welcome: ${wpErrors.slice(0, 2).join(" | ")}`);
    await welcome.close();
  }
  await context.close();
}

// Every internal link seen anywhere must resolve to a real route.
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();
const linkTargets = [...seenLinks].filter((l) => !l.startsWith("/goodwork/") && !l.startsWith("/api/") && !/\.(html|json|png|jpg|svg)$/.test(l) && !l.startsWith("mailto:"));
let checked = 0;
for (const l of linkTargets) {
  await page.goto(`${base}${l}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(250);
  const title = await page.title();
  if (/not found/i.test(title)) problems.push(`broken internal link: ${l}`);
  checked++;
}
await context.close();
await browser.close();
server.close();

console.log(`\nchecked ${checked} distinct internal links`);
if (problems.length) {
  console.log(`\n${problems.length} problem(s):`);
  for (const p of problems) console.log(`  - ${p}`);
  process.exit(1);
}
console.log("\nall routes clean");
