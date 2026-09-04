// Beauty Heaven Hub — logo build spec for scripts/build-brand-logo.mjs
//
//   npm run brand:logo -- beauty-heaven-hub
//
// The logo is three words at the same size. The only distinction is weight:
// beauty (light) · heaven (bold) · hub (light). No gradients, no shadows, no
// metallic effects, no pink. Every application below is a flat ink on a flat
// ground, which is what makes it feel expensive.
//
// Sizes are in ems of the wordmark's type size.

export default {
  name: "Beauty Heaven Hub",

  fonts: {
    light: "fonts/Jost-Light.ttf",
    medium: "fonts/Jost-Medium.ttf",
    bold: "fonts/Jost-Bold.ttf",
  },

  colours: {
    taupe: "#746B60",
    gold: "#C9A65C",
    ivory: "#F4F0E9",
    espresso: "#24211E",
    black: "#000000",
  },

  // Clear space built into the artwork: tight on transparent files (the
  // designer sets the margin), a proper tile on the ground variants.
  pad: 0.16,
  groundPad: 0.45,

  // Raster widths per application family. The wordmark overrides below.
  png: { ground: [1024, 2048], transparent: [2048] },

  marks: [
    {
      id: "wordmark",
      title: "wordmark",
      align: "left",
      png: { ground: [1024, 2048], transparent: [1024, 2048, 4096] },
      lines: [
        {
          tracking: 0.01,
          gap: 0.28,
          runs: [
            { text: "beauty", weight: "light" },
            { text: "heaven", weight: "bold" },
            { text: "hub", weight: "light" },
          ],
        },
      ],
    },
    {
      id: "stacked",
      title: "stacked",
      align: "center",
      lines: [
        { tracking: 0.01, runs: [{ text: "beauty", weight: "light" }] },
        { tracking: 0.01, before: 1.06, runs: [{ text: "heaven", weight: "bold" }] },
        { tracking: 0.01, before: 1.06, runs: [{ text: "hub", weight: "light" }] },
      ],
    },
    // The two worlds under the master brand. Same wordmark, minus "hub",
    // with the world set small, uppercase and tracked beneath it.
    {
      id: "treatments",
      title: "Treatments lockup",
      align: "center",
      lines: [
        {
          tracking: 0.01,
          gap: 0.28,
          runs: [
            { text: "beauty", weight: "light" },
            { text: "heaven", weight: "bold" },
          ],
        },
        { size: 0.24, tracking: 0.36, before: 2.7, runs: [{ text: "TREATMENTS", weight: "medium" }] },
      ],
    },
    {
      id: "academy",
      title: "Academy lockup",
      align: "center",
      lines: [
        {
          tracking: 0.01,
          gap: 0.28,
          runs: [
            { text: "beauty", weight: "light" },
            { text: "heaven", weight: "bold" },
          ],
        },
        { size: 0.24, tracking: 0.36, before: 2.7, runs: [{ text: "ACADEMY", weight: "medium" }] },
      ],
    },
  ],

  applications: [
    { id: "gold-on-taupe", title: "champagne gold on Heaven Taupe (primary)", ink: "gold", ground: "taupe" },
    { id: "espresso-on-ivory", title: "Deep Espresso on Warm Ivory", ink: "espresso", ground: "ivory" },
    { id: "gold-on-espresso", title: "champagne gold on Deep Espresso", ink: "gold", ground: "espresso" },
    { id: "ivory", title: "Warm Ivory, transparent — for dark photography", ink: "ivory", ground: null },
    { id: "gold", title: "champagne gold, transparent", ink: "gold", ground: null },
    { id: "espresso", title: "Deep Espresso, transparent", ink: "espresso", ground: null },
    { id: "black", title: "single-colour black, transparent", ink: "black", ground: null },
  ],

  statics: [
    { file: "logo/favicon.svg", name: "favicon", widths: [32, 180, 192, 512] },
  ],
};
