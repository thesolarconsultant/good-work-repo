// Bundles dist/ into one self-contained HTML file (CSS, fonts and JS inlined)
// for sharing a preview without a server.
//
//   VITE_HASH_ROUTER=1 npx vite build --base ./ && node scripts/build-preview.mjs
//
// Hash routing is required: a static file has no server to rewrite /services.

import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const files = readdirSync(join(dist, 'assets'));
const cssName = files.find((f) => f.endsWith('.css'));
const jsName = files.find((f) => f.endsWith('.js'));

const mime = { woff2: 'font/woff2', woff: 'font/woff', png: 'image/png', svg: 'image/svg+xml' };
let css = readFileSync(join(dist, 'assets', cssName), 'utf8');

css = css.replace(/url\(\.\/([A-Za-z0-9._-]+)\)/g, (m, file) => {
  const ext = file.split('.').pop();
  if (!mime[ext]) return m;
  const b64 = readFileSync(join(dist, 'assets', file)).toString('base64');
  return `url(data:${mime[ext]};base64,${b64})`;
});

// The published page can't guarantee a charset declaration, so keep the whole
// document ASCII: non-ASCII copy becomes \uXXXX escapes (JS) / \XXXX (CSS).
const escapeUnicode = (s, wrap) =>
  // oxlint-disable-next-line no-control-regex -- matching the whole ASCII range is the point
  s.replace(/[^\u0000-\u007F]/g, (c) => wrap(c.codePointAt(0).toString(16)));

css = escapeUnicode(css, (hex) => `\\${hex} `);
const js = escapeUnicode(readFileSync(join(dist, 'assets', jsName), 'utf8'), (hex) => `\\u${hex.padStart(4, '0')}`);

const html = `<title>GOOD WORK. Services</title>
<style>${css}</style>
<div id="root"></div>
<script type="module">${js}</script>
`;

const out = join(root, 'preview', 'goodwork-preview.html');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, html);
console.log(out, (html.length / 1024 / 1024).toFixed(2) + ' MB');
