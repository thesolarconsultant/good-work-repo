// =========================================================
// Product icons: one glyph for each thing Goodwork sells.
//
// Drawn on a 1024 grid as a white line glyph with one element in the brand
// gradient, which the markup refers to as url(#g). components/OfferIcon.jsx
// puts a glyph on a black disc for the site's cards, and
// scripts/build-product-icons.mjs renders the same discs as the product images
// in Stripe, so the two never drift apart.
//
// `grad` is the gradient's start and end point on the grid, so it runs across
// the coloured element whatever its shape.
// =========================================================

const S = 'stroke="#fff" stroke-width="44" fill="none" stroke-linecap="round" stroke-linejoin="round"';
const GS = 'stroke="url(#g)" stroke-width="44" fill="none" stroke-linecap="round" stroke-linejoin="round"';
// A stroke the colour of the disc, drawn under a shape so it cuts a clean gap
// where the shape overlaps a line.
const HALO = 'stroke="#111111" stroke-width="44" paint-order="stroke"';

const windowFrame = `<rect x="212" y="252" width="600" height="520" rx="56" ${S}/><line x1="212" y1="372" x2="812" y2="372" ${S}/><circle cx="282" cy="312" r="16" fill="#fff"/><circle cx="342" cy="312" r="16" fill="#fff"/><circle cx="402" cy="312" r="16" fill="#fff"/>`;

const sparkle = (cx, cy, r) => {
  const k = r * 0.14;
  return `M ${cx} ${cy - r} Q ${cx + k} ${cy - k} ${cx + r} ${cy} Q ${cx + k} ${cy + k} ${cx} ${cy + r} Q ${cx - k} ${cy + k} ${cx - r} ${cy} Q ${cx - k} ${cy - k} ${cx} ${cy - r} Z`;
};

export const ICONS = {
  // Components: a grid of blocks, one of them ready to use.
  library: {
    grad: [542, 542, 762, 762],
    body: `<rect x="262" y="262" width="220" height="220" rx="40" ${S}/><rect x="542" y="262" width="220" height="220" rx="40" ${S}/><rect x="262" y="542" width="220" height="220" rx="40" ${S}/><rect x="520" y="520" width="264" height="264" rx="52" fill="url(#g)"/>`,
  },
  // Systems: connected parts.
  studio: {
    grad: [422, 602, 602, 782],
    body: `<line x1="430" y1="352" x2="594" y2="352" ${S}/><line x1="375" y1="446" x2="453" y2="587" ${S}/><line x1="649" y1="446" x2="571" y2="587" ${S}/><circle cx="322" cy="352" r="78" ${S}/><circle cx="702" cy="352" r="78" ${S}/><circle cx="512" cy="692" r="100" fill="url(#g)"/>`,
  },
  // A finished site, built for you.
  built: {
    grad: [282, 442, 482, 702],
    body: `${windowFrame}<rect x="282" y="442" width="200" height="260" rx="28" fill="url(#g)"/><line x1="552" y1="472" x2="742" y2="472" ${S}/><line x1="552" y1="572" x2="742" y2="572" ${S}/><line x1="552" y1="672" x2="672" y2="672" ${S}/>`,
  },
  // A customer record.
  crm: {
    grad: [262, 392, 452, 662],
    body: `<rect x="192" y="272" width="640" height="480" rx="60" ${S}/><circle cx="357" cy="442" r="66" fill="url(#g)"/><path d="M 252 662 C 252 584 300 552 357 552 C 414 552 462 584 462 662 Z" fill="url(#g)"/><line x1="547" y1="432" x2="742" y2="432" ${S}/><line x1="547" y1="522" x2="702" y2="522" ${S}/><line x1="547" y1="612" x2="652" y2="612" ${S}/>`,
  },
  // An agency, built up in stages.
  agency: {
    grad: [632, 272, 792, 772],
    body: `<rect x="232" y="572" width="160" height="200" rx="28" ${S}/><rect x="432" y="432" width="160" height="340" rx="28" ${S}/><rect x="610" y="250" width="204" height="544" rx="44" fill="url(#g)"/>`,
  },
  // Ads and business development.
  coaching: {
    grad: [652, 342, 872, 682],
    body: `<path d="M 232 452 H 312 L 572 322 V 702 L 312 572 H 232 Z" ${S}/><path d="M 322 582 L 362 732" ${S}/><path d="M 672 442 Q 722 512 672 582" ${GS}/><path d="M 752 362 Q 862 512 752 662" ${GS}/>`,
  },
  // Monthly: the website kept safe and running.
  care: {
    grad: [402, 432, 632, 592],
    body: `<path d="M 512 222 L 772 322 V 512 C 772 662 662 752 512 802 C 362 752 252 662 252 512 V 322 Z" ${S}/><path d="M 402 512 L 482 592 L 632 432" stroke="url(#g)" stroke-width="52" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  // Monthly: the website and the Content Console.
  console: {
    grad: [292, 542, 732, 542],
    body: `${windowFrame}<line x1="292" y1="472" x2="612" y2="472" ${S}/><line x1="292" y1="572" x2="732" y2="572" ${GS}/><line x1="292" y1="672" x2="532" y2="672" ${S}/>`,
  },
  // Monthly: everything, including the chat and voice agents.
  complete: {
    grad: [372, 342, 652, 582],
    body: `<path d="M 292 262 H 732 Q 792 262 792 322 V 602 Q 792 662 732 662 H 472 L 352 772 V 662 H 292 Q 232 662 232 602 V 322 Q 232 262 292 262 Z" ${S}/><line x1="392" y1="432" x2="392" y2="492" ${GS}/><line x1="472" y1="382" x2="472" y2="542" ${GS}/><line x1="552" y1="342" x2="552" y2="582" ${GS}/><line x1="632" y1="402" x2="632" y2="522" ${GS}/>`,
  },
  // Monthly: everything, plus AI imagery and B-roll.
  "complete-ai": {
    grad: [622, 172, 862, 412],
    body: `<rect x="212" y="322" width="520" height="440" rx="60" ${S}/><path d="M 412 432 L 572 542 L 412 652 Z" fill="#fff" stroke="#fff" stroke-width="24" stroke-linejoin="round"/><path d="${sparkle(742, 292, 130)}" fill="url(#g)" ${HALO} stroke-linejoin="round"/>`,
  },
  // Monthly add-on: the CRM, run for you.
  "crm-running": {
    grad: [574, 574, 830, 830],
    body: `<rect x="162" y="212" width="580" height="440" rx="56" ${S}/><circle cx="312" cy="372" r="58" ${S}/><path d="M 222 562 C 228 506 266 482 312 482 C 358 482 396 506 402 562" ${S}/><line x1="482" y1="362" x2="652" y2="362" ${S}/><line x1="482" y1="452" x2="612" y2="452" ${S}/><circle cx="712" cy="712" r="132" fill="url(#g)" ${HALO}/><line x1="712" y1="652" x2="712" y2="772" ${S}/><line x1="652" y1="712" x2="772" y2="712" ${S}/>`,
  },
};

// The five Studio systems, in the same hand, for the system cards and the
// product illustrations.
ICONS["whatsapp-bot"] = {
  // A conversation.
  grad: [352, 402, 672, 482],
  body: `<path d="M 292 262 H 732 Q 792 262 792 322 V 562 Q 792 622 732 622 H 452 L 332 742 V 622 H 292 Q 232 622 232 562 V 322 Q 232 262 292 262 Z" ${S}/><circle cx="392" cy="442" r="44" fill="url(#g)"/><circle cx="512" cy="442" r="44" fill="url(#g)"/><circle cx="632" cy="442" r="44" fill="url(#g)"/>`,
};
ICONS["voice-agent"] = {
  // A voice, answered.
  grad: [332, 332, 692, 692],
  body: `<circle cx="512" cy="512" r="290" ${S}/><line x1="392" y1="462" x2="392" y2="562" ${GS}/><line x1="472" y1="402" x2="472" y2="622" ${GS}/><line x1="552" y1="362" x2="552" y2="662" ${GS}/><line x1="632" y1="432" x2="632" y2="592" ${GS}/>`,
};
ICONS["content-console"] = ICONS.console;
ICONS["brand-guide"] = {
  // A guideline page: the mark, then the rules.
  grad: [432, 312, 592, 472],
  body: `<rect x="292" y="212" width="440" height="600" rx="48" ${S}/><circle cx="512" cy="392" r="92" fill="url(#g)"/><line x1="392" y1="572" x2="632" y2="572" ${S}/><line x1="392" y1="662" x2="572" y2="662" ${S}/>`,
};
ICONS.automations = {
  // Two inputs, one outcome.
  grad: [422, 622, 602, 802],
  body: `<rect x="222" y="222" width="180" height="180" rx="40" ${S}/><rect x="622" y="222" width="180" height="180" rx="40" ${S}/><path d="M 312 402 V 512 H 712 V 402" ${S}/><line x1="512" y1="512" x2="512" y2="600" ${S}/><rect x="410" y="610" width="204" height="204" rx="46" fill="url(#g)"/>`,
};

export const GRADIENT_STOPS = [
  [0, "#3366ff"],
  [0.32, "#7a5cff"],
  [0.68, "#ff2db3"],
  [1, "#ff6b5e"],
];

/** The glyph sits inside the disc at this scale, so nothing comes near the edge. */
export const GLYPH_SCALE = 0.78;

/**
 * The whole icon as standalone SVG markup: the disc, the glyph and its
 * gradient under `gradientId`. `ground` fills the square behind the disc
 * (null leaves it transparent).
 */
export function iconSvg(id, { gradientId = "g", ground = null, size = 1024 } = {}) {
  const icon = ICONS[id];
  if (!icon) throw new Error(`No icon "${id}".`);
  const [x1, y1, x2, y2] = icon.grad;
  const stops = GRADIENT_STOPS.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join("");
  const body = icon.body.replaceAll("url(#g)", `url(#${gradientId})`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="${size}" height="${size}"><defs><linearGradient id="${gradientId}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops}</linearGradient></defs>${ground ? `<rect width="1024" height="1024" fill="${ground}"/>` : ""}<circle cx="512" cy="512" r="512" fill="#111111"/><g transform="translate(512 512) scale(${GLYPH_SCALE}) translate(-512 -512)">${body}</g></svg>`;
}
