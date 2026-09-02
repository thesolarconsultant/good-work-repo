import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
// Embeds the full component library (engine/library/components.txt) into
// pitch.html's #lib-data slot, so the Pitch tool can offer every component
// as an isolated, brand-themed section. Re-run whenever the library changes.
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, "..", "library", "components.txt");
const OUT = path.join(HERE, "pitch.html");

const raw = fs.readFileSync(SRC, "utf8");
const comps = raw.split(/^@@@ /m).filter(Boolean).map(block => {
  const nl = block.indexOf("\n");
  const [id, name, cat, desc] = block.slice(0, nl).trim().split(" :: ");
  return { id, name, cat, desc: desc || "", code: block.slice(nl + 1).replace(/\s+$/, "") };
});
// JSON, safe to sit inside a <script type="application/json"> block:
// escape every '<' as < so no tag (</script>, <style>, …) can ever
// break the block. JSON.parse restores the real characters at runtime.
// '$' is escaped too: '$'' / '$&' / '$1' are String.replace patterns, and any
// host that splices this page into a template with a string replacement
// would expand them and tear the block open.
const json = JSON.stringify(comps).replace(/</g, "\\u003c").replace(/\$/g, "\\u0024");

let html = fs.readFileSync(OUT, "utf8");
const re = /(<script type="application\/json" id="lib-data">)[\s\S]*?(<\/script>)/;
if (!re.test(html)) { console.error("lib-data slot not found in pitch.html"); process.exit(1); }
// function replacement so '$' sequences inside the component code are NOT
// treated as replacement patterns (that silently truncates the JSON).
html = html.replace(re, (_m, open, close) => open + json + close);
// sanity: exactly one lib-data block, and the app script must follow it directly.
const tags = html.match(/<script type="application\/json" id="lib-data">/g) || [];
const endIdx = html.indexOf("</script>", html.indexOf('id="lib-data"')) + 9;
if (tags.length !== 1 || !html.slice(endIdx, endIdx + 9).startsWith("\n<script>")) {
  console.error("pitch.html lib-data block is malformed (tags:", tags.length + ") — not writing"); process.exit(1);
}
fs.writeFileSync(OUT, html);
console.log("embedded", comps.length, "components into pitch.html (" + (json.length/1024).toFixed(0) + " KB)");
