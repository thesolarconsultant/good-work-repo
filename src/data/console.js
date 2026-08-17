// The Content Console showcase. Every claim is something the built consoles
// actually do — The Solar Consultant's (inside their portal) and 8energy's
// hosted Studio. Screenshots in public/console are the real running app.

export const CONSOLE_SECTIONS = [
  {
    id: "signin",
    kicker: "The way in",
    title: "One login, any device",
    does: "The Console is hosted on the client's own domain behind a single password — or, for The Solar Consultant, as a section of their staff portal. No app to install, no seat licences, no per-user admin. Open it on a laptop at the desk or a phone in the van.",
    great: "Content stops being a job that can only happen at the office, on the one machine with the software on it. That friction — not the writing — is usually why a business goes quiet online.",
    shot: { src: "/console/studio-login.jpg", caption: "8energy's Studio sign-in, on their own subdomain and in their own brand." },
  },
  {
    id: "pipeline",
    kicker: "01 · Blogs",
    title: "A pipeline, not a pile of drafts",
    does: "Posts move across a board — backlog, drafting, review, published — with a live count against each stage. The Solar Consultant's console adds two more views on the same posts: grouped by category, and a review queue that badges how many pieces are waiting on you. Everything left of 'published' is private.",
    great: "You can see the state of the whole content operation in one glance: what's queued, what's being written, what needs your eyes, what's out. That's the difference between running content and hoping someone remembers to post.",
    shot: { src: "/console/studio-blogs.jpg", caption: "8energy's board — draft, review, published, with four posts live." },
  },
  {
    id: "editor",
    kicker: "02 · The editor",
    title: "Write in plain Markdown, with the SEO fields right there",
    does: "Title, URL slug, category, read time, date and the excerpt that doubles as the meta description sit on the same screen as the body. The body is Markdown — headings, bold, lists, links. That's the whole format.",
    great: "The fields that decide whether a post ranks are impossible to forget, because they're in the form. And because the source is Markdown rather than a proprietary blob, every post stays yours and stays portable.",
    shot: { src: "/console/studio-blog-editor.jpg", caption: "A real post open in the editor — SEO fields above, Markdown body below, publish at the bottom." },
  },
  {
    id: "publish",
    kicker: "03 · Publishing",
    title: "Live in about a minute, with nobody touching code",
    does: "Publishing writes the branded HTML page — SEO meta, header, footer — adds the card to the blog index and commits it. The site redeploys itself. Draft just saves the source.",
    great: "The gap between 'we should write something' and 'it's live' is where most content dies. Here it's one button, and it never needs a developer, a plugin or a CMS migration.",
    shot: null,
  },
  {
    id: "social",
    kicker: "04 · Social media",
    title: "Posts and copy packs, viewed how you need them",
    does: "A social tab holds the posts themselves and the copy packs that go with each article, switchable between a grid overview and a single-post view, searchable by hook line.",
    great: "Most businesses write the article and then never tell anyone it exists. Keeping the pack beside the post means the distribution is written when the piece is, not three weeks later when someone remembers.",
    shot: null,
  },
  {
    id: "email",
    kicker: "05 · Email",
    title: "Templates with the subject line and preview text where they belong",
    does: "The emails a business sends constantly — welcome, booking, reminder, follow-up — live as branded templates with their subject line and inbox preview text as first-class fields, edited in plain wording and previewed exactly as the customer will see them.",
    great: "Email HTML is horrible to write and trivial to break. Anyone can update the wording without wrecking the layout, and the subject and preview text — the two things that actually decide whether it gets opened — stop being an afterthought.",
    shot: { src: "/console/studio-emails.jpg", caption: "8energy's welcome email previewed live beside the template list." },
  },
  {
    id: "whatsapp",
    kicker: "06 · WhatsApp",
    title: "Approved templates, each with the trigger that fires it",
    does: "The WhatsApp and SMS templates sit in the same console, categorised as utility messages and showing the trigger that sends each one, with merge fields for names and job details.",
    great: "WhatsApp templates have to be approved before they can send, so they can't be improvised in the moment. Holding them here — with their trigger visible — means everyone answers in the same voice and the automated follow-up is something you can actually read and edit.",
    shot: null,
  },
  {
    id: "store",
    kicker: "07 · Underneath",
    title: "No rented database. The content stays yours.",
    does: "8energy's Studio commits published content straight back to their own repository, which triggers the deploy — it reads and writes through that one store, hosted or offline. The Solar Consultant's runs on their own portal's data, alongside the CRM it feeds.",
    great: "There's no subscription holding the content hostage. Every post has a full version history, the site stays static and fast because of it, and if we disappeared tomorrow the content and the site would carry on exactly as they are.",
    shot: null,
  },
];

export const ENGINE_SECTIONS = [
  {
    id: "intake",
    kicker: "08 · The intake bot",
    title: "It interviews you, so nobody faces a blank page",
    does: "A structured interview pulls the post out of whatever the business is working on this week — a client case, a tariff change, a question customers keep asking — one question at a time, drilling for specifics: real numbers, dates, suppliers, system sizes, and where each figure came from.",
    great: "The facts come from the person who did the work, so the writing sounds like them and stays true. It turns the hardest part of content — knowing what to write about — into a five-minute conversation.",
  },
  {
    id: "gates",
    kicker: "09 · Quality gates",
    title: "The data is checked before a word gets written",
    does: "Source data has to pass validation first: the source must be on the whitelist, figures must be fresh within a set number of days, rates must sit inside a plausible range, a comparison needs at least three suppliers, every rate carries the URL it came from, and anything unverifiable is deleted rather than estimated. Posts publish with a 'data correct as of' stamp, and nothing auto-publishes.",
    great: "It's the difference between content marketing and being a source people trust. In a market full of invented savings figures, publishing only what can be evidenced is the whole competitive advantage — and the gates make it automatic rather than a matter of willpower.",
  },
  {
    id: "radar",
    kicker: "10 · Topic radar",
    title: "A ranked backlog, and a monthly sweep for what's new",
    does: "A standing backlog of high-intent topics, each ranked by priority and carrying the honest angle to take, plus a monthly pass that looks for fresh subjects from real signals — price changes, rule changes, questions coming up again and again.",
    great: "Nobody has to sit and think of ideas, which is the other reason content stops. The rule stays explicit: the radar finds topics, but the facts still go through the gates before anything publishes.",
  },
  {
    id: "broll",
    kicker: "11 · Branded video",
    title: "B-roll generated on-brand, from your own footage",
    does: "A brand style file — colour grade, setting, camera language, an avoid-list — is baked into every video prompt, and a shot library composes against it. Some shots animate the client's own drone stills, so the footage shows genuinely real UK homes rather than stock.",
    great: "It gives a small business a steady supply of video that looks deliberate and looks like them. Retune the style file once and the whole library changes with it — the opposite of commissioning clips one at a time and hoping they match.",
  },
];

export const CONSOLE_OUTCOMES = [
  { figure: "~1 min", label: "from finished draft to live on the site" },
  { figure: "4", label: "channels run from one screen" },
  { figure: "0", label: "databases, plugins or developer tickets" },
  { figure: "100%", label: "of the content stays yours" },
];
