/* ============================================================================
   Beauty Heaven email templates.

   Seven emails built to the standard of email/welcome.html: the logo header,
   an arched photograph of the salon, a light headline with one bold word,
   the gold pill, then the blocks each email needs (reassurance points,
   numbered steps, an appointment card, the two worlds, a review on the wall)
   and the espresso footer. Four colour styles, and every arched photo exists
   in all four, because email clients drop border-radius: the arch and its
   hairline are baked into the image on the exact colour behind it
   (email/arches/, made from the salon's own photographs).

   Built the way email has to be: tables, inline styles, 600px, a hidden
   preheader, a VML button for Outlook, columns that stack without a media
   query, absolute image URLs, alt text on every image.

   Merge tags are GoHighLevel's, as in welcome.html; if the salon sends from
   elsewhere they are a find and replace. Anything no tag can fill (a date, a
   fee, a real review) is a [bracketed gap] for a person, never a guess.
   ========================================================================== */

// Where the images live: the salon's own site serves them at /email/, the
// Good Work copy of the console at its brand-kit path.
const ROOT = location.pathname.startsWith("/goodwork/")
  ? `${location.origin}/goodwork/brands/beauty-heaven-hub/`
  : `${location.origin}/`;
const EM = ROOT + "email/";
const FONT = "'Jost','Century Gothic',Futura,Helvetica,Arial,sans-serif";

export const THEMES = {
  signature: {
    label: "Signature taupe", swatch: "#746B60", ring: "#C9A65C",
    wall: "#ECE6DD", body: "#F4F0E9", head: "#746B60", logo: "logo-gold.png",
    eyebrow: "#7F6329", ink: "#24211E", text: "#4A443E", line: "#D9CFC2",
    btn: "#C9A65C", btnInk: "#24211E", alt: "#ECE6DD", card: "#FBF9F5",
    band: "#746B60", bandEyebrow: "#E3CD94", bandInk: "#F4F0E9", bandSub: "#D8D2C8",
    foot: "#24211E", footLogo: "logo-gold.png", footInk: "#B9AFA2", footLink: "#E3CD94", footSmall: "#8A8177", accent: "#C9A65C",
  },
  ivory: {
    label: "Light ivory", swatch: "#FFFFFF", ring: "#24211E",
    wall: "#F4F0E9", body: "#FFFFFF", head: "#FFFFFF", logo: "logo-espresso.png",
    eyebrow: "#A8843F", ink: "#24211E", text: "#4A443E", line: "#E8E0D4",
    btn: "#24211E", btnInk: "#F4F0E9", alt: "#F4F0E9", card: "#F4F0E9",
    band: "#ECE6DD", bandEyebrow: "#7F6329", bandInk: "#24211E", bandSub: "#6B6257",
    foot: "#F4F0E9", footLogo: "logo-espresso.png", footInk: "#6B6257", footLink: "#7F6329", footSmall: "#8A8177", accent: "#A8843F",
  },
  evening: {
    label: "Evening espresso", swatch: "#24211E", ring: "#C9A65C",
    wall: "#161412", body: "#24211E", head: "#24211E", logo: "logo-gold.png",
    eyebrow: "#C9A65C", ink: "#F4F0E9", text: "#D8D2C8", line: "#3D3731",
    btn: "#C9A65C", btnInk: "#24211E", alt: "#1C1A17", card: "#2E2A26",
    band: "#2E2A26", bandEyebrow: "#C9A65C", bandInk: "#F4F0E9", bandSub: "#B9AFA2",
    foot: "#161412", footLogo: "logo-gold.png", footInk: "#8F8579", footLink: "#C9A65C", footSmall: "#6B6257", accent: "#C9A65C",
  },
  gold: {
    label: "Gold occasion", swatch: "#C9A65C", ring: "#24211E",
    wall: "#ECE6DD", body: "#FBF6EA", head: "#C9A65C", logo: "logo-espresso.png",
    eyebrow: "#7F6329", ink: "#24211E", text: "#4A443E", line: "#E3CD94",
    btn: "#24211E", btnInk: "#F4F0E9", alt: "#F4E9CF", card: "#FFFDF7",
    band: "#C9A65C", bandEyebrow: "#24211E", bandInk: "#24211E", bandSub: "#4A443E",
    foot: "#24211E", footLogo: "logo-gold.png", footInk: "#B9AFA2", footLink: "#E3CD94", footSmall: "#8A8177", accent: "#A8843F",
  },
};

export const PHOTOS = {
  treatment: "Treatment room",
  mirrors: "Salon floor, the arched mirrors",
  lounge: "The lounge, with the wings",
  reception: "Reception",
  portrait: "Reception, close",
};

export const SAMPLE = {
  "{{contact.first_name}}": "Sarah",
  "{{custom_values.booking_url}}": "https://www.beautyheavenhub.co/book/",
  "{{location.full_address}}": "23-24 Conduit Lane, Hoddesdon, Hertfordshire EN11 8FN",
  "{{location.phone}}": "01992 511383",
  "{{location.email}}": "hello@beautyheavenhub.co",
  "{{unsubscribe_link}}": "#",
};

/* ------------------------------------------------------------ the blocks -- */
let T = THEMES.signature;
let themeKey = "signature";

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
// *word* in a headline is set bold: light, lowercase, one word bold — the logo's own idea.
const rich = (s) => esc(s).replace(/\*([^*]+)\*/g, '<b style="font-weight:700;">$1</b>').replace(/\n/g, "<br>");
const lines = (s) => String(s || "").split("\n").map((l) => l.trim()).filter(Boolean);
const P = (size, lh, color, extra = "") => `font-family:${FONT}; font-size:${size}px; line-height:${lh}px; color:${color};${extra}`;
const row = (bg, pad, inner, cls = "bh-pad") => `<tr><td class="${cls}" bgcolor="${bg}" style="background-color:${bg}; padding:${pad};">${inner}</td></tr>`;
const eyebrowP = (s, color = T.eyebrow, mb = 16) => (s ? `<p style="margin:0 0 ${mb}px; ${P(11, 16, color, " letter-spacing:2.6px; text-transform:uppercase; font-weight:500;")}">${esc(s)}</p>` : "");

function header() {
  return row(T.head, "26px 24px 22px", `<img src="${EM}${T.logo}" width="240" alt="Beauty Heaven Hub" style="width:240px; max-width:70%; height:auto; display:block; margin:0 auto;">`, "") +
    (T.head === T.body ? `<tr><td style="height:1px; line-height:1px; font-size:1px; background-color:${T.line};">&nbsp;</td></tr>` : "");
}

function hero(photo, alt) {
  if (!photo) return "";
  return `<tr><td align="center" bgcolor="${T.body}" style="background-color:${T.body}; padding:0;"><img src="${EM}arches/${photo}-${themeKey}-hero.jpg" width="600" alt="${esc(alt || PHOTOS[photo] || "")}" style="width:100%; max-width:600px; height:auto; display:block;"></td></tr>`;
}

function message(v) {
  const paras = String(v.body || "").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
    .map((p, i, a) => `<p style="margin:0 0 ${i === a.length - 1 ? 28 : 16}px; ${P(16, 26, T.text)}">${esc(p).replace(/\n/g, "<br>")}</p>`).join("\n");
  return row(T.body, "34px 44px 0", `${eyebrowP(v.eyebrow)}
${v.headline ? `<h1 class="bh-display" style="margin:0 0 20px; ${P(38, 42, T.ink, " font-weight:300; letter-spacing:-0.5px;")}">${rich(v.headline)}</h1>` : ""}
${paras}`);
}

function button(label, link, bg = T.body) {
  if (!label) return "";
  return row(bg, "0 44px 34px", `<!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${esc(link)}" style="height:48px;v-text-anchor:middle;width:250px;" arcsize="50%" fillcolor="${T.btn}" stroke="f"><w:anchorlock/><center style="color:${T.btnInk};font-family:Helvetica,Arial,sans-serif;font-size:12px;font-weight:bold;letter-spacing:2px;">${esc(label).toUpperCase()}</center></v:roundrect><![endif]-->
<!--[if !mso]><!-- --><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" bgcolor="${T.btn}" style="background-color:${T.btn}; border-radius:999px;"><a href="${esc(link)}" style="display:inline-block; padding:15px 32px; ${P(12, 14, T.btnInk, " letter-spacing:2px; text-transform:uppercase; font-weight:700; text-decoration:none;")}">${esc(label)}</a></td></tr></table><!--<![endif]-->`);
}

// Three short reassurances in a row, each with a gold tick.
function points(list) {
  const items = lines(list).slice(0, 3);
  if (!items.length) return "";
  const cell = (t) => `<td class="bh-stack" valign="top" style="padding:14px 8px; border-top:1px solid ${T.line}; border-bottom:1px solid ${T.line};"><p style="margin:0; ${P(13, 19, T.text)}"><span style="color:${T.accent}; font-weight:700;">&#10003;</span>&nbsp; ${esc(t)}</p></td>`;
  return row(T.body, "0 36px 30px", `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${items.map(cell).join("")}</tr></table>`);
}

// "Title — detail" lines as numbered steps in gold circles.
function steps(title, list, bg = T.body) {
  const items = lines(list);
  if (!items.length) return "";
  const step = (l, i) => {
    const [head, ...rest] = l.split(/\s+[—–-]\s+/);
    return `<tr><td width="46" valign="top" style="padding:0 0 18px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td width="32" height="32" align="center" bgcolor="${T.accent}" style="background-color:${T.accent}; border-radius:50%; ${P(14, 32, "#24211E", " font-weight:700;")}">${i + 1}</td></tr></table></td>
<td valign="top" style="padding:4px 0 18px;"><p style="margin:0 0 4px; ${P(16, 22, T.ink, " font-weight:500;")}">${esc(head)}</p>${rest.length ? `<p style="margin:0; ${P(14, 22, T.text)}">${esc(rest.join(" — "))}</p>` : ""}</td></tr>`;
  };
  return row(bg, "8px 44px 18px", `${title ? `<h2 class="bh-h2" style="margin:0 0 20px; ${P(24, 29, T.ink, " font-weight:300;")}">${rich(title)}</h2>` : ""}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${items.map(step).join("")}</table>`);
}

// A bordered card: first line bold, the rest beneath. "Label: value" lines become a two-column list.
function card(list) {
  const items = lines(list);
  if (!items.length) return "";
  const kv = items.every((l) => /^[^:]{2,24}:\s+\S/.test(l));
  const inner = kv
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${items.map((l) => { const [k, ...v] = l.split(/:\s+/); return `<tr><td valign="top" style="padding:9px 0; width:38%; border-bottom:1px solid ${T.line}; ${P(11, 18, T.eyebrow, " letter-spacing:2px; text-transform:uppercase; font-weight:500;")}">${esc(k)}</td><td valign="top" style="padding:9px 0; border-bottom:1px solid ${T.line}; ${P(15, 22, T.ink)}">${esc(v.join(": "))}</td></tr>`; }).join("")}</table>`
    : `<p style="margin:0 0 6px; ${P(17, 24, T.ink, " font-weight:500;")}">${esc(items[0])}</p>${items.slice(1).map((l) => `<p style="margin:0; ${P(15, 23, T.text)}">${esc(l)}</p>`).join("")}`;
  return row(T.body, "0 44px 30px", `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${T.line};"><tr><td bgcolor="${T.card}" style="background-color:${T.card}; padding:20px 22px;">${inner}</td></tr></table>`);
}

// Treatments and Academy, side by side, stacking on a phone without a media query.
function worlds(heading) {
  const col = (photo, kicker, title, sub, alt) => `<div class="bh-col" style="display:inline-block; width:100%; max-width:260px; padding:0 5px; vertical-align:top; box-sizing:border-box;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:0 0 12px;"><img src="${EM}arches/${photo}-${themeKey}-small.jpg" width="250" alt="${esc(alt)}" style="width:100%; max-width:250px; height:auto; display:block;"></td></tr><tr><td style="padding:0 0 20px;"><p style="margin:0 0 6px; ${P(10, 14, T.eyebrow, " letter-spacing:2.4px; text-transform:uppercase; font-weight:500;")}">${kicker}</p><p style="margin:0 0 8px; ${P(19, 24, T.ink, " font-weight:300;")}">${title}</p><p style="margin:0; ${P(14, 22, T.text)}">${sub}</p></td></tr></table></div>`;
  return row(T.alt, "34px 34px 12px", `${eyebrowP(heading || "What are you here for?", T.eyebrow, 22)}<!--[if mso]><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td width="50%" valign="top"><![endif]-->${col("mirrors", "Treatments", "Something for me.", "Beauty &middot; Hair &middot; Skin &middot; Aesthetics &middot; Wellness", "The salon floor and its arched mirrors")}<!--[if mso]></td><td width="50%" valign="top"><![endif]-->${col("lounge", "Academy", "Something for my future.", "Professional beauty &amp; aesthetics education", "The lounge, with the wings")}<!--[if mso]></td></tr></table><![endif]-->`);
}

function review(quote, by, heading) {
  if (!quote) return "";
  return row(T.band, "34px 44px", `${eyebrowP(heading || "What clients say", T.bandEyebrow, 14)}<p class="bh-quote" style="margin:0 0 14px; ${P(19, 29, T.bandInk, " font-weight:300;")}">&ldquo;${esc(quote)}&rdquo;</p><p style="margin:0; ${P(12, 18, T.bandSub)}">${esc(by || "")}</p>`);
}

function footer() {
  return `<tr><td class="bh-pad" align="center" bgcolor="${T.foot}" style="background-color:${T.foot}; padding:32px 44px 34px;">
<img src="${EM}${T.footLogo}" width="180" alt="Beauty Heaven Hub" style="width:180px; max-width:60%; height:auto; display:block; margin:0 auto 18px;">
<p style="margin:0 0 8px; ${P(13, 21, T.footInk)}">{{location.full_address}}</p>
<p style="margin:0 0 18px; ${P(13, 21, T.footInk)}"><a href="tel:{{location.phone}}" style="color:${T.footLink}; text-decoration:none;">{{location.phone}}</a>&nbsp;&middot;&nbsp;<a href="mailto:{{location.email}}" style="color:${T.footLink}; text-decoration:none;">{{location.email}}</a></p>
<p style="margin:0; ${P(11, 18, T.footSmall)}">You&rsquo;re receiving this because you&rsquo;re a Beauty Heaven Hub client. <a href="{{unsubscribe_link}}" style="color:${T.footSmall}; text-decoration:underline;">Unsubscribe</a></p>
</td></tr>`;
}

function page(v, rows) {
  return `<!doctype html>
<html lang="en-GB" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">
<title>${esc(v.subject)}</title>
<!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
<style>
  @font-face { font-family:'Jost'; font-weight:300; font-display:swap; src:url('${ROOT}fonts/Jost-Light.woff2') format('woff2'); }
  @font-face { font-family:'Jost'; font-weight:500; font-display:swap; src:url('${ROOT}fonts/Jost-Medium.woff2') format('woff2'); }
  @font-face { font-family:'Jost'; font-weight:700; font-display:swap; src:url('${ROOT}fonts/Jost-Bold.woff2') format('woff2'); }
  body, table, td, a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
  table, td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
  img { -ms-interpolation-mode:bicubic; border:0; outline:none; text-decoration:none; display:block; }
  a { text-decoration:none; }
  @media only screen and (max-width:620px) {
    .bh-pad { padding-left:22px !important; padding-right:22px !important; }
    .bh-display { font-size:30px !important; line-height:34px !important; }
    .bh-h2 { font-size:21px !important; line-height:26px !important; }
    .bh-col { max-width:100% !important; padding:0 !important; }
    .bh-col img { max-width:100% !important; width:100% !important; }
    .bh-quote { font-size:17px !important; line-height:25px !important; }
    .bh-stack { display:block !important; width:100% !important; border-top:0 !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:${T.wall};">
<div style="display:none; font-size:1px; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden; mso-hide:all;">${esc(v.pre)}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${T.wall};"><tr><td align="center" style="padding:24px 12px;">
<!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%; background-color:${T.body};">
${header()}
${rows.join("\n")}
${footer()}
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table>
</body></html>`;
}

/* --------------------------------------------------------- the templates --
   Each: a name, when to use it, the fields it asks for, the defaults it
   starts with (real wording in the brand's voice, gaps in brackets), and
   the order its blocks run in. */
const F = {
  subject: { label: "Subject line", type: "text" },
  pre: { label: "Preheader", hint: "the grey line in the inbox, under 90 characters", type: "text" },
  photo: { label: "Photo", type: "photo" },
  eyebrow: { label: "Eyebrow", type: "text" },
  headline: { label: "Headline", hint: "*one word* in stars is set bold", type: "text" },
  body: { label: "Message", hint: "a blank line between paragraphs", type: "textarea", rows: 7 },
  points: { label: "Three reassurances", hint: "one per line", type: "textarea", rows: 3 },
  card: { label: "The details", hint: "one per line; 'Label: value' makes a list", type: "textarea", rows: 4 },
  stepsTitle: { label: "Steps heading", type: "text" },
  steps: { label: "Steps", hint: "one per line, 'Title — detail'", type: "textarea", rows: 5 },
  button: { label: "Button", type: "text" },
  link: { label: "Button link", type: "text" },
  quote: { label: "Review", hint: "a real client's words, with their permission", type: "textarea", rows: 3 },
  quoteBy: { label: "Who said it", type: "text" },
};

export const TEMPLATES = {
  welcome: {
    label: "Welcome",
    use: "A new client's first email: who you are, both sides of the business.",
    fields: ["subject", "pre", "photo", "eyebrow", "headline", "body", "button", "link", "quote", "quoteBy"],
    defaults: {
      subject: "Welcome to Beauty Heaven Hub", pre: "Every beauty discipline and a professional academy, under one roof.",
      photo: "treatment", eyebrow: "Welcome to Heaven", headline: "hello {{contact.first_name}},\nyou're very *welcome* here.",
      body: "Thanks for getting in touch. Beauty Heaven Hub brings every beauty discipline and a professional academy under one roof: beauty, hair, skin, aesthetics and wellness, plus the training if you'd rather be the one holding the brush.\n\nIf it's your first treatment, that's most people once. We'll talk you through what happens before it happens, and you can stop and ask anything at any point.",
      button: "Book a treatment", link: "{{custom_values.booking_url}}",
      quote: "[A real client's words, with their permission]", quoteBy: "[Client's first name]",
    },
    blocks: (v) => [hero(v.photo), message(v), button(v.button, v.link), worlds(), review(v.quote, v.quoteBy, "Loved by our clients")],
  },
  spotlight: {
    label: "Treatment spotlight",
    use: "One treatment, properly explained: what it is, what happens, how to book.",
    fields: ["subject", "pre", "photo", "eyebrow", "headline", "body", "points", "stepsTitle", "steps", "button", "link", "quote", "quoteBy"],
    defaults: {
      subject: "[Treatment], explained", pre: "What it is, what happens, and whether it's right for you.",
      photo: "treatment", eyebrow: "The treatment", headline: "[treatment],\n*explained*.",
      body: "[Two or three sentences on what the treatment is and who it's for, in plain words.]\n\n[What it feels like, and what you look like walking out.]",
      points: "[How long it takes]\n[From £ price]\nPatch test first, if needed",
      stepsTitle: "What *happens*", steps: "We talk it through — what you'd like, and anything we need to know first.\nThe treatment — [what happens, in a line].\nAftercare — what to do for the next few days, in writing.",
      button: "Book [treatment]", link: "{{custom_values.booking_url}}",
      quote: "[A real client's words about this treatment, with their permission]", quoteBy: "[Client's first name]",
    },
    blocks: (v) => [hero(v.photo), message(v), points(v.points), steps(v.stepsTitle, v.steps), button(v.button, v.link), review(v.quote, v.quoteBy)],
  },
  visit: {
    label: "Before your visit",
    use: "After booking: when, where, what to expect and what to bring.",
    fields: ["subject", "pre", "photo", "eyebrow", "headline", "card", "body", "stepsTitle", "steps", "button", "link"],
    defaults: {
      subject: "See you soon, {{contact.first_name}}", pre: "Everything you need before your appointment.",
      photo: "reception", eyebrow: "Your appointment", headline: "see you *soon*,\n{{contact.first_name}}.",
      card: "[Treatment] with [practitioner]\n[Day, date] at [time]\n{{location.full_address}}",
      body: "We're looking forward to seeing you. Here's everything worth knowing before you come in.",
      stepsTitle: "Before you *come*", steps: "Arrive five minutes early — time to settle in, no rush.\nCome as you are — [anything to avoid or bring for this treatment].\nNeed to change it? — call us on {{location.phone}}, [notice period] before if you can.",
      button: "Get directions", link: "https://maps.google.com/?q=Beauty+Heaven+Hub+Hoddesdon",
    },
    blocks: (v) => [hero(v.photo), message({ ...v, body: "" }), card(v.card), message({ body: v.body }), steps(v.stepsTitle, v.steps), button(v.button, v.link)],
  },
  aftercare: {
    label: "Aftercare",
    use: "The day after: how to look after it, as numbered steps.",
    fields: ["subject", "pre", "photo", "eyebrow", "headline", "body", "stepsTitle", "steps", "button", "link"],
    defaults: {
      subject: "Looking after your [treatment]", pre: "The next few days, step by step.",
      photo: "mirrors", eyebrow: "Aftercare", headline: "looking *after* your\n[treatment].",
      body: "Thank you for coming in, {{contact.first_name}}. Here's how to look after it for the next few days.",
      stepsTitle: "The next few *days*", steps: "[First 24 hours] — [what to do and avoid].\n[Day two and three] — [what to do and avoid].\n[The one thing people get wrong] — [what to do instead].\nAnything unusual? — message us straight away, we'd rather hear from you.",
      button: "Message us", link: "https://wa.me/447424219417",
    },
    blocks: (v) => [hero(v.photo), message(v), steps(v.stepsTitle, v.steps), button(v.button, v.link)],
  },
  academy: {
    label: "Academy course",
    use: "A course: what it is, the details, and how to get a place.",
    fields: ["subject", "pre", "photo", "eyebrow", "headline", "body", "card", "stepsTitle", "steps", "button", "link", "quote", "quoteBy"],
    defaults: {
      subject: "[Course name] at the Academy", pre: "Taught in a working salon, with online pre-study before you arrive.",
      photo: "lounge", eyebrow: "Beauty Heaven Academy", headline: "[course name],\n*taught properly*.",
      body: "[Who the course is for, and what you'll be able to do at the end, in plain words.]\n\nYou'll train in a working salon, practising on real models, with the online study done before your classroom day.",
      card: "Dates: [dates]\nLength: [length]\nDeposit: [deposit] secures your place\nPre-study: Online, on a computer or tablet",
      stepsTitle: "How it *works*", steps: "Ask — tell us which course, and we'll talk you through dates.\nSecure your place — a deposit holds it, and we confirm by email.\nStudy, then train — online pre-study first, then hands-on in the salon.",
      button: "Ask about this course", link: "https://wa.me/447424219417",
      quote: "[A real student's words, with their permission]", quoteBy: "[Student's first name], [course]",
    },
    blocks: (v) => [hero(v.photo), message(v), card(v.card), steps(v.stepsTitle, v.steps), button(v.button, v.link), review(v.quote, v.quoteBy, "From our students")],
  },
  thanks: {
    label: "Thank you & review",
    use: "A few days after a visit: thanks, and one easy ask for a Google review.",
    fields: ["subject", "pre", "photo", "eyebrow", "headline", "body", "button", "link"],
    defaults: {
      subject: "Thank you for coming in", pre: "And one small favour, if you have a minute.",
      photo: "portrait", eyebrow: "Thank you", headline: "thank you for\n*coming in*.",
      body: "Hi {{contact.first_name}}, it was lovely to see you. We hope you're enjoying the results.\n\nIf you have a minute, a quick Google review helps other people find us, and means a great deal to a small team.",
      button: "Leave a review", link: "[Google review link]",
    },
    blocks: (v) => [hero(v.photo), message(v), button(v.button, v.link), worlds("Something else while you're here?")],
  },
  news: {
    label: "News & occasions",
    use: "An announcement, a new treatment, a date. Pairs well with Gold occasion.",
    fields: ["subject", "pre", "photo", "eyebrow", "headline", "body", "points", "button", "link"],
    defaults: {
      subject: "[The news, in a few words]", pre: "[The detail, in a line.]",
      photo: "mirrors", eyebrow: "News", headline: "[the news],\nin *one line*.",
      body: "[The detail underneath, in two or three sentences.]\n\n[One thing to do about it.]",
      points: "[Detail one]\n[Detail two]\n[Detail three]",
      button: "Book now", link: "{{custom_values.booking_url}}",
    },
    blocks: (v) => [hero(v.photo), message(v), points(v.points), button(v.button, v.link)],
  },
};

export const FIELDS = F;

export function render(templateKey, theme, values) {
  const t = TEMPLATES[templateKey] || TEMPLATES.welcome;
  themeKey = THEMES[theme] ? theme : "signature";
  T = THEMES[themeKey];
  const v = { ...t.defaults, ...(values || {}) };
  return page(v, t.blocks(v).filter(Boolean));
}

export function sample(html) {
  let out = html;
  for (const [tag, val] of Object.entries(SAMPLE)) out = out.split(tag).join(val);
  return out;
}
