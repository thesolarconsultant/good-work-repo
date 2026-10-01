// Guards the one place a price lives outside src/data/offers.js: the product
// map in server/products.js that checkout charges and the claim endpoint
// checks (amounts in pence). If someone changes £280 or £888 in the data file
// and not there, the build fails here rather than a customer paying the wrong
// figure.

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const offers = readFileSync(join(root, "src", "data", "offers.js"), "utf8");
const products = readFileSync(join(root, "server", "products.js"), "utf8");

function offerPrice(id) {
  const block = offers.slice(offers.indexOf(`id: "${id}"`));
  const m = block.match(/price:\s*([\d.]+)/);
  if (!m) throw new Error(`no price for ${id} in offers.js`);
  return Math.round(Number(m[1]) * 100);
}
function checkoutAmount(id) {
  const m = products.match(new RegExp(`${id}:\\s*\\{[^}]*amount:\\s*(\\d+)`));
  if (!m) throw new Error(`no amount for ${id} in server/products.js`);
  return Number(m[1]);
}

let bad = 0;
for (const id of ["library", "studio"]) {
  const a = offerPrice(id);
  const b = checkoutAmount(id);
  if (a !== b) {
    console.error(`price mismatch for ${id}: offers.js says ${a}p, server/products.js says ${b}p`);
    bad++;
  }
}
if (bad) process.exit(1);
console.log("prices: server/products.js agrees with src/data/offers.js");
