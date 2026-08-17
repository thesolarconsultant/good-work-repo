// The Content Console showcase. Every claim is something the built consoles
// actually do. Screenshots are the real running apps: The Solar Consultant's
// console (the fullest build) and, where noted, 8energy's Studio.

export const CONSOLE_SECTIONS = [
  {
    id: "pipeline",
    kicker: "01 · The pipeline",
    title: "The whole content operation, on one board",
    does: "Topics move across four columns — backlog, drafting, review, published — with a live count on each. Every card carries the target search query it's written for, a priority, and a flag saying whether it needs verified data before anyone can write it. The screenshot is The Solar Consultant's console: 24 topics queued, 2 being written, 12 live.",
    great: "One glance tells you the state of the whole operation: what's queued, what's being written, what's waiting on you, what's out. That's the difference between running content deliberately and hoping somebody remembers to post something this month.",
    shot: { src: "/console/tsc-console-pipeline.jpg", caption: "The Solar Consultant's pipeline — real backlog, real published posts, priorities and data flags on every card." },
  },
  {
    id: "categories",
    kicker: "02 · Search clusters",
    title: "A backlog organised the way search actually works",
    does: "The same topics, grouped into the search clusters they belong to — tariffs and export, batteries, and so on. Each row holds the topic, its target query, its priority, its data risk and its status, all editable in place. Saving writes straight back to the project's own topic file.",
    great: "It stops content being a stream of one-off ideas and turns it into coverage of the subjects your customers actually search. You can see at a glance where a cluster is thin — and the honest angle is recorded next to each topic, so the piece gets written the way you'd argue it in person.",
    shot: { src: "/console/tsc-console-categories.jpg", caption: "Editing the backlog by cluster — priority, data risk and status per topic, saved back to the project's own file." },
  },
  {
    id: "review",
    kicker: "03 · The review queue",
    title: "Nothing publishes because it was forgotten about",
    does: "A dedicated review view badges how many pieces are sitting with you, so approving work is a queue you clear rather than a thing you have to remember to check.",
    great: "The bottleneck in every content operation is the owner's attention. Making it a visible queue with a number on it means work doesn't rot in a drafts folder for three weeks.",
    shot: null,
  },
  {
    id: "email",
    kicker: "04 · Email",
    title: "Templates, previewed with real sample data",
    does: "The client's email templates in one list, previewed as desktop or mobile, with sample data toggled on so merge tags fill in as a customer would see them — while the copied HTML keeps the raw tags intact for the CRM. Edit the wording, or copy the finished HTML straight into GoHighLevel.",
    great: "It closes the gap between what you write and what lands in an inbox. You see the real thing on a real phone width before it sends, and the merge fields can't get mangled on the way into the CRM.",
    shot: { src: "/console/tsc-console-email.jpg", caption: "The Solar Consultant's email templates — sample data on, desktop/mobile preview, one-click copy for the CRM." },
  },
  {
    id: "social",
    kicker: "05 · Social",
    title: "Every blog ships with its social pack",
    does: "A social tab holds the Facebook and Instagram pack that goes out with each article, generated from the post itself and stored beside it.",
    great: "Most businesses write the article and then never tell anyone it exists. Tying the pack to the post means the distribution is written when the piece is — not three weeks later, when nobody can remember the angle.",
    shot: null,
  },
  {
    id: "editor",
    kicker: "06 · Writing and publishing",
    title: "Plain Markdown, with the SEO fields on the same screen",
    does: "Title, URL slug, category, read time, date and the excerpt that doubles as the meta description sit above a Markdown body. Publishing writes the branded page, adds the card to the blog index and commits it — the site redeploys itself. This screen is 8energy's Studio, which runs the same pattern.",
    great: "The fields that decide whether a post ranks are impossible to forget, because they're in the form. And the gap between 'we should write something' and 'it's live' becomes one button — no developer, no CMS plugin, no ticket.",
    shot: { src: "/console/studio-blog-editor.jpg", caption: "8energy's editor — SEO fields above, Markdown body below, publish writes the branded page." },
  },
  {
    id: "whatsapp",
    kicker: "07 · WhatsApp",
    title: "Approved templates, each with the trigger that fires it",
    does: "WhatsApp and SMS templates live in the console too, categorised as utility messages, showing the pipeline trigger that sends each one and the numbered variables Meta requires at submission.",
    great: "WhatsApp templates have to be approved before they can send, so they can't be improvised mid-conversation. Holding them here — with their trigger visible — means everyone answers in the same voice, and the automated follow-up is something you can read and edit rather than a black box in the CRM.",
    shot: null,
  },
  {
    id: "store",
    kicker: "08 · Underneath",
    title: "No rented database. The content stays yours.",
    does: "The Solar Consultant's console reads and writes the project's own files. 8energy's commits published content back to their repository, which triggers the deploy — and runs offline against local files when there's no network.",
    great: "There's no subscription holding the content hostage. Every post has a full version history, the site stays static and fast because of it, and if we disappeared tomorrow the content and the site would carry on exactly as they are.",
    shot: null,
  },
];

export const ENGINE_SECTIONS = [
  {
    id: "intake",
    kicker: "09 · The intake bot",
    title: "It interviews you, so nobody faces a blank page",
    does: "A structured interview pulls the post out of whatever the business is working on this week — a client case, a tariff change, a question customers keep asking — one question at a time, drilling for specifics: real numbers, dates, suppliers, system sizes, and where each figure came from.",
    great: "The facts come from the person who did the work, so the writing sounds like them and stays true. It turns the hardest part of content — knowing what to write about — into a five-minute conversation.",
  },
  {
    id: "gates",
    kicker: "10 · Quality gates",
    title: "The data is checked before a word gets written",
    does: "Source data has to pass validation first: the source must be on the whitelist, figures must be fresh within a set number of days, rates must sit inside a plausible range, a comparison needs at least three suppliers, every rate carries the URL it came from, and anything unverifiable is deleted rather than estimated. Posts publish with a 'data correct as of' stamp, and nothing auto-publishes.",
    great: "It's the difference between content marketing and being a source people trust. In a market full of invented savings figures, publishing only what can be evidenced is the whole competitive advantage — and the gates make it automatic rather than a matter of willpower.",
  },
  {
    id: "radar",
    kicker: "11 · Topic radar",
    title: "A monthly sweep for what's changed",
    does: "Alongside the standing backlog, a monthly pass looks for fresh subjects from real signals — price changes, rule changes, questions coming up again and again — and files them into the right cluster.",
    great: "Nobody has to sit and think of ideas, which is the other reason content stops. The rule stays explicit: the radar finds topics, but the facts still go through the gates before anything publishes.",
  },
  {
    id: "broll",
    kicker: "12 · Branded video",
    title: "B-roll generated on-brand, from your own footage",
    does: "A brand style file — colour grade, setting, camera language, an avoid-list — is baked into every video prompt, and a shot library composes against it. Some shots animate the client's own drone stills, so the footage shows genuinely real UK homes rather than stock.",
    great: "It gives a small business a steady supply of video that looks deliberate and looks like them. Retune the style file once and the whole library changes with it — the opposite of commissioning clips one at a time and hoping they match.",
  },
];

export const CONSOLE_OUTCOMES = [
  { figure: "4", label: "stages from idea to published" },
  { figure: "38", label: "topics tracked on one client's board" },
  { figure: "~1 min", label: "from finished draft to live" },
  { figure: "100%", label: "of the content stays yours" },
];
