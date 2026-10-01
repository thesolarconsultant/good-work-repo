// Builds the customer bundle to dist-library/ — the same files api/download.js
// serves after an access key is checked, so what the owner hands over by hand
// and what the site delivers are the same thing.
//
//   npm run library:bundle
//   SITE_URL=https://goodworkagency.uk npm run library:bundle   (links inside it)
//
// Writes dist-library/goodwork-library-<version>/ (unpacked, for a look) and
// dist-library/goodwork-library-<version>.zip (deflated). dist-library/ is
// gitignored: the bundle is generated from library-src/components.txt.

import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateRawSync } from "node:zlib";
import ITEMS from "../server/generated/libraryItems.js";
import { LIBRARY_VERSION, LIBRARY_UPDATED, CATEGORY_NAMES } from "../server/generated/libraryMeta.js";
import { bundleFiles, bundleName, zip } from "../server/libraryBundle.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "dist-library");
const name = bundleName(LIBRARY_VERSION);
const dir = join(out, name);
const siteUrl = (process.env.SITE_URL || "https://goodworkagency.uk").replace(/\/$/, "");

const files = bundleFiles({ items: ITEMS, version: LIBRARY_VERSION, updated: LIBRARY_UPDATED, categoryNames: CATEGORY_NAMES, siteUrl });

rmSync(dir, { recursive: true, force: true });
for (const f of files) {
  const path = join(dir, f.path);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, f.content);
}

const bytes = zip(files, {
  prefix: `${name}/`,
  deflate: (data) => new Uint8Array(deflateRawSync(data)),
  date: new Date(`${LIBRARY_UPDATED}T09:00:00Z`),
});
const zipPath = join(out, `${name}.zip`);
writeFileSync(zipPath, bytes);

const unpacked = files.reduce((n, f) => n + Buffer.byteLength(f.content), 0);
console.log(`bundle: ${files.length} files, ${ITEMS.length} components, v${LIBRARY_VERSION} (${LIBRARY_UPDATED}), links to ${siteUrl}`);
console.log(`bundle: ${dir}  (${(unpacked / 1024).toFixed(0)} kB unpacked)`);
console.log(`bundle: ${zipPath}  (${(bytes.length / 1024).toFixed(0)} kB)`);
