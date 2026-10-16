// Builds ONE self-contained page (fonts, code and sample pictures inside it)
// so the app can be previewed from a single file. Run: npm run build:preview
import { build } from 'esbuild';
import fs from 'node:fs';

const root = new URL('../', import.meta.url).pathname;
const js = (await build({ entryPoints: [root + 'js/app.js'], bundle: true, format: 'iife', minify: true, write: false, target: 'es2020' })).outputFiles[0].text;

let css = ['fonts', 'styles', 'pop-bg', 'pop', 'glass'].map((f) => fs.readFileSync(root + `css/${f}.css`, 'utf8')).join('\n');
css = css.replace(/url\(\.\.\/assets\/fonts\/([^)]+)\)/g, (_, f) =>
  `url(data:font/woff2;base64,${fs.readFileSync(root + 'assets/fonts/' + f).toString('base64')})`);

const samples = {};
for (const f of fs.readdirSync(root + 'assets/photos')) {
  samples[f.replace('.jpg', '')] = 'data:image/jpeg;base64,' + fs.readFileSync(root + 'assets/photos/' + f).toString('base64');
}

const html = `<title>Little Tales</title>
<style>${css}</style>
<div id="app"><main id="screen" aria-live="polite"></main></div>
<script>window.__SAMPLES=${JSON.stringify(samples)};window.__DEMO_CAMERA=true;</script>
<script>${js.replace(/<\/script/g, '<\\/script')}</script>
`;
fs.mkdirSync(root + 'dist', { recursive: true });
fs.writeFileSync(root + 'dist/little-tales-preview.html', html);
console.log('Built dist/little-tales-preview.html', (html.length / 1024).toFixed(0) + ' KB');
