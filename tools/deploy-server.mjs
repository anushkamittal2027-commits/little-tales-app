// One command that switches on the server side: reminder keys, secrets and the 6 server functions.
// Run:  node tools/deploy-server.mjs      (needs Node and an internet connection; nothing is sent to anyone but your own Supabase project)
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const REF = 'vnorlnjsvknhsvjfczyl';
const FUNCTIONS = ['delete-account', 'nudges', 'lifecycle', 'create-subscription', 'cancel-subscription', 'razorpay-webhook'];
const say = (m) => console.log('\n==> ' + m);
const run = (args, opts = {}) => {
  const r = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['--yes', 'supabase', ...args], { cwd: root, stdio: 'inherit', shell: process.platform === 'win32', ...opts });
  if (r.status !== 0) { console.error('\nThat step did not finish. Copy the red text above and send it to Claude.'); process.exit(1); }
};

// ---- reminder keys (made once, kept in .vapid.json on this computer so a re-run reuses them) ----
function vapid() {
  const file = root + '.vapid.json';
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const pj = publicKey.export({ format: 'jwk' }), sj = privateKey.export({ format: 'jwk' });
  const b64u = (buf) => Buffer.from(buf).toString('base64url');
  const pub = b64u(Buffer.concat([Buffer.from([4]), Buffer.from(pj.x, 'base64url'), Buffer.from(pj.y, 'base64url')]));
  const keys = { publicKey: pub, privateKey: sj.d };
  fs.writeFileSync(file, JSON.stringify(keys, null, 2));
  return keys;
}

say('1/5  Signing in to Supabase (a browser page opens: click Allow)');
run(['login']);
say('2/5  Connecting this folder to your project');
run(['link', '--project-ref', REF]);
say('3/5  Making the reminder keys');
const keys = vapid();
say('4/5  Saving the secrets in Supabase (they stay in Supabase, not in the website)');
run(['secrets', 'set', `VAPID_PUBLIC_KEY=${keys.publicKey}`, `VAPID_PRIVATE_KEY=${keys.privateKey}`, 'MAIL_FROM=Little Tales <hellolittletales@gmail.com>', '--project-ref', REF]);
say('5/5  Putting the server functions online');
for (const f of FUNCTIONS) { console.log('   - ' + f); run(['functions', 'deploy', f, '--project-ref', REF, '--use-api']); }

console.log('\n==============================================================');
console.log('DONE. The server functions and secrets are online.');
console.log('Last step: do docs/SCHEDULE_STEP.md (paste two SQL blocks in Supabase).');
console.log('(The website already contains the matching reminder key, so nothing else needs uploading.)');
console.log('==============================================================');
