// Builds the real website into dist/site (what Cloudflare Pages serves). Run: npm run build:site
// - bundles the code into one file (so the Supabase library loads), copies styles, fonts, pictures
// - turns the Privacy and Terms drafts into pages at /privacy and /terms
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const out = root + 'dist/site/';
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

await build({ entryPoints: [root + 'js/app.js'], bundle: true, format: 'esm', minify: true, outfile: out + 'app.js', target: 'es2020', legalComments: 'none' });

const copy = (from, to) => fs.cpSync(root + from, out + to, { recursive: true });
copy('css', 'css'); copy('assets', 'assets'); copy('manifest.webmanifest', 'manifest.webmanifest');
fs.rmSync(out + 'assets/sample', { recursive: true, force: true });   // generation scratch files, if any

fs.writeFileSync(out + 'index.html', fs.readFileSync(root + 'index.html', 'utf8').replace('src="js/app.js"', 'src="app.js"'));

// service worker: list the real files of this build
const list = [];
const walk = (d) => { for (const f of fs.readdirSync(out + d)) { const p = path.posix.join(d, f); fs.statSync(out + p).isDirectory() ? walk(p) : (!p.startsWith('assets/photos') && list.push(p)); } };
walk('css'); walk('assets');
const shell = ['./', 'index.html', 'app.js', 'manifest.webmanifest', ...list];
let sw = fs.readFileSync(root + 'sw.js', 'utf8').replace(/const SHELL = \[[\s\S]*?\];/, 'const SHELL = ' + JSON.stringify(shell) + ';');
fs.writeFileSync(out + 'sw.js', sw);

// legal pages
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>');
function md(src) {
  let html = '', list = false;
  for (const line of src.split('\n')) {
    const li = line.match(/^[-*] (.*)/);
    if (list && !li) { html += '</ul>'; list = false; }
    if (li) { if (!list) { html += '<ul>'; list = true; } html += `<li>${inline(li[1])}</li>`; }
    else if (/^### /.test(line)) html += `<h3>${inline(line.slice(4))}</h3>`;
    else if (/^## /.test(line)) html += `<h2>${inline(line.slice(3))}</h2>`;
    else if (/^# /.test(line)) html += `<h1>${inline(line.slice(2))}</h1>`;
    else if (line.trim()) html += `<p>${inline(line)}</p>`;
  }
  return html + (list ? '</ul>' : '');
}
const page = (title, body) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} | Little Tales</title><link rel="stylesheet" href="css/fonts.css"><style>body{margin:0;background:#FBF8F2;color:#2E3134;font:16px/1.65 Inter,system-ui,sans-serif}main{max-width:680px;margin:0 auto;padding:28px 20px 80px}h1,h2{font-family:'Playfair Display',Georgia,serif;line-height:1.2}h1{font-size:2rem}h2{margin-top:2rem;font-size:1.3rem}a{color:#3D6A99}.top{font-family:'Playfair Display',Georgia,serif;font-weight:600;text-decoration:none;color:#2E3134}</style></head><body><main><a class="top" href="./">&larr; Little Tales</a>${body}</main></body></html>`;
fs.writeFileSync(out + 'privacy.html', page('Privacy Policy', md(fs.readFileSync(root + 'docs/legal/PRIVACY_POLICY_DRAFT.md', 'utf8'))));
fs.writeFileSync(out + 'terms.html', page('Terms of Use', md(fs.readFileSync(root + 'docs/legal/TERMS_DRAFT.md', 'utf8'))));

fs.writeFileSync(out + 'robots.txt', 'User-agent: *\nAllow: /\n\nSitemap: https://littletales.me/sitemap.xml\n');
fs.writeFileSync(out + 'sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>https://littletales.me/</loc></url>\n  <url><loc>https://littletales.me/terms</loc></url>\n  <url><loc>https://littletales.me/privacy</loc></url>\n</urlset>\n');

// Cloudflare Pages: safe headers (it already serves terms.html at /terms; a rewrite back to .html makes a redirect loop)
fs.writeFileSync(out + '_headers', '/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(self), microphone=(self)\n/sw.js\n  Cache-Control: no-cache\n');
const size = (d) => fs.readdirSync(d, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? size(d + '/' + e.name) : fs.statSync(d + '/' + e.name).size), 0);
console.log('Built dist/site', (size(out) / 1048576).toFixed(1) + ' MB');
