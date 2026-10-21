// Behaviour tests for the server functions, against a fake database.   Run: supabase/tests/functions/run.sh
// deno-lint-ignore-file no-explicit-any
import { assert, assertEquals } from 'jsr:@std/assert@1';
Deno.env.set('SUPABASE_URL', 'http://fake'); Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'service-key'); Deno.env.set('SUPABASE_ANON_KEY', 'anon');
Deno.env.set('VAPID_PUBLIC_KEY', 'p'); Deno.env.set('VAPID_PRIVATE_KEY', 'k'); Deno.env.set('RESEND_API_KEY', 'resend'); Deno.env.set('RAZORPAY_WEBHOOK_SECRET', 'whsec'); Deno.env.set('DODO_WEBHOOK_SECRET', 'whsec_' + btoa('dodo-secret-bytes')); Deno.env.set('DODO_PRODUCT_MONTHLY', 'pdt_m'); Deno.env.set('DODO_PRODUCT_YEARLY', 'pdt_y');
Deno.env.set('RAZORPAY_KEY_ID', 'rzp_test'); Deno.env.set('RAZORPAY_KEY_SECRET', 'secret'); Deno.env.set('RAZORPAY_PLAN_MONTHLY', 'plan_m'); Deno.env.set('RAZORPAY_PLAN_YEARLY', 'plan_y');

const handlers: Record<string, (r: Request) => Promise<Response> | Response> = {};
let current = '';
(Deno as any).serve = (h: any) => { handlers[current] = h; };
for (const name of ['lifecycle', 'nudges', 'razorpay-webhook', 'dodo-webhook', 'create-dodo-checkout', 'cancel-dodo-subscription', 'transcribe', 'create-subscription', 'cancel-subscription', 'delete-account']) { current = name; await import(`../../functions/${name}/index.ts?${name}`); }
const { db, resetDb } = await import('./stub_supabase.ts');
const { sent } = await import('./stub_webpush.ts');

const calls: { url: string; init?: RequestInit }[] = [];
const realFetch = globalThis.fetch;
let razorpayOk = true;
globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
  const u = String(url); calls.push({ url: u, init });
  if (u.includes('api.resend.com')) return new Response('{}', { status: 200 });
  if (u.includes('api.openai.com/v1/audio/transcriptions')) return new Response(JSON.stringify({ text: ' Hello there ' }), { status: 200 });
  if (u.includes('dodopayments.com/checkouts')) return new Response(JSON.stringify({ checkout_url: 'https://test.checkout.dodopayments.com/session/cks_1' }), { status: 200 });
  if (u.includes('dodopayments.com/subscriptions/')) return new Response('{}', { status: 200 });
  if (u.includes('api.razorpay.com/v1/subscriptions') && u.endsWith('/cancel')) return new Response(JSON.stringify(razorpayOk ? { id: 'sub_1' } : { error: { description: 'nope' } }), { status: razorpayOk ? 200 : 400 });
  if (u.includes('api.razorpay.com/v1/subscriptions')) return new Response(JSON.stringify({ id: 'sub_new', short_url: 'https://rzp.io/x' }), { status: 200 });
  return realFetch(url as any, init);
}) as any;
const sched = (body = '{}') => new Request('http://f', { method: 'POST', body, headers: { Authorization: 'Bearer service-key' } });
const member = (o: any = {}) => ({ id: 'u1', email: 'a@x.y', tz: 'Asia/Kolkata', notify_email: true, notify_push: true, ...o });

Deno.test('scheduled jobs refuse callers without the service key', async () => {
  for (const n of ['lifecycle', 'nudges']) assertEquals((await handlers[n](new Request('http://f', { method: 'POST' }))).status, 401);
});

Deno.test('lifecycle: warns at 7 and 1 days left, once, and not at other times', async () => {
  resetDb(); calls.length = 0;
  db.tables.profiles.push(member({ id: 'a', email: 'a@x.y' }), member({ id: 'b', email: 'b@x.y' }), member({ id: 'c', email: 'c@x.y' }), member({ id: 'd', email: 'd@x.y', notify_email: false }));
  db.status.a = { status: 'locked', hold_left: 7 }; db.status.b = { status: 'locked', hold_left: 1 }; db.status.c = { status: 'locked', hold_left: 12 }; db.status.d = { status: 'locked', hold_left: 7 };
  const r1 = await (await handlers.lifecycle(sched())).json();
  assertEquals(r1.warned, 2);
  const mails = calls.filter((c) => c.url.includes('resend')).map((c) => JSON.parse(String(c.init?.body)));
  assertEquals(mails.map((m) => m.to).sort(), ['a@x.y', 'b@x.y']);
  assert(mails.find((m) => m.to === 'b@x.y').subject.toLowerCase().includes('last day'));
  const r2 = await (await handlers.lifecycle(sched())).json();
  assertEquals(r2.warned, 0);                       // the same warning is never sent twice in a day
});

Deno.test('lifecycle: after 30 days locked, tales, files and videos are deleted for good', async () => {
  resetDb();
  db.tables.profiles.push(member({ id: 'gone' }), member({ id: 'keep' }));
  db.status.gone = { status: 'deleted' }; db.status.keep = { status: 'locked', hold_left: 20 };
  db.tables.tales.push({ id: 't1', user_id: 'gone' }, { id: 't2', user_id: 'keep' });
  db.files['photos/gone'] = ['t1.jpg', 't1-thumb.jpg']; db.files['photos/keep'] = ['t2.jpg'];
  const r = await (await handlers.lifecycle(sched())).json();
  assertEquals(r.deleted, 1);
  assertEquals(db.tables.tales.map((t: any) => t.id), ['t2']);
  assertEquals(db.files['photos/gone'], []); assertEquals(db.files['photos/keep'], ['t2.jpg']);
});

function zoneWithHour(h: number): string {
  const zones = (Intl as any).supportedValuesOf('timeZone') as string[];
  const hourOf = (z: string) => Number(new Intl.DateTimeFormat('en-GB', { timeZone: z, hour: '2-digit', hour12: false }).format(new Date()));
  const z = zones.find((x) => hourOf(x) === h); if (!z) throw new Error('no zone at hour ' + h); return z;
}
Deno.test('nudges: sent in each member\'s own 1pm and 8pm, skipped for locked members, and the 8pm one is skipped after a tale', async () => {
  for (const [hour, kind] of [[13, 'nudge-13'], [20, 'nudge-20']] as const) {
    resetDb(); sent.length = 0; const tz = zoneWithHour(hour);
    db.tables.profiles.push(member({ id: 'ok', tz }), member({ id: 'locked', tz }), member({ id: 'kept', tz }), member({ id: 'wrongtime', tz: zoneWithHour((hour + 5) % 24) }), member({ id: 'off', tz, notify_push: false }));
    for (const id of ['ok', 'locked', 'kept', 'wrongtime', 'off']) db.tables.push_subscriptions.push({ id: 's-' + id, user_id: id, endpoint: 'https://push/' + id, p256dh: 'a', auth: 'b' });
    db.status.ok = { status: 'trial' }; db.status.locked = { status: 'locked' }; db.status.kept = { status: 'subscribed' }; db.status.wrongtime = { status: 'trial' }; db.status.off = { status: 'trial' };
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date());
    db.tables.tales.push({ id: 't', user_id: 'kept', tale_date: today });
    await handlers.nudges(sched());
    const who = sent.map((s) => s.endpoint.split('/').pop()).sort();
    assertEquals(who, kind === 'nudge-13' ? ['kept', 'ok'] : ['ok']);
    sent.length = 0; await handlers.nudges(sched()); assertEquals(sent.length, 0);   // no repeats the same day
  }
});

Deno.test('nudges: a phone that has unsubscribed is cleaned up', async () => {
  resetDb(); sent.length = 0; const tz = zoneWithHour(13);
  db.tables.profiles.push(member({ id: 'x', tz })); db.status.x = { status: 'trial' };
  db.tables.push_subscriptions.push({ id: 's1', user_id: 'x', endpoint: 'https://push/gone', p256dh: 'a', auth: 'b' });
  await handlers.nudges(sched());
  assertEquals(db.tables.push_subscriptions.length, 0);
});

async function sign(body: string, secret = 'whsec') {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return [...new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body)))].map((b) => b.toString(16).padStart(2, '0')).join('');
}
const hook = async (event: string, secret?: string, notes: any = { user_id: 'u9', plan: 'yearly' }) => {
  const body = JSON.stringify({ event, payload: { subscription: { entity: { id: 'sub_1', customer_id: 'c1', current_end: 1900000000, notes } } } });
  return handlers['razorpay-webhook'](new Request('http://f', { method: 'POST', body, headers: { 'x-razorpay-signature': await sign(body, secret) } }));
};
Deno.test('payments webhook: only a correctly signed call changes anything', async () => {
  resetDb();
  assertEquals((await hook('subscription.activated', 'wrong-secret')).status, 401);
  assertEquals(db.tables.subscriptions.length, 0);
  assertEquals((await hook('subscription.activated')).status, 200);
  assertEquals(db.tables.subscriptions[0].status, 'active'); assertEquals(db.tables.subscriptions[0].plan, 'yearly'); assertEquals(db.tables.subscriptions[0].user_id, 'u9');
  await hook('subscription.charged'); assertEquals(db.tables.subscriptions[0].status, 'active');
  await hook('subscription.pending'); assertEquals(db.tables.subscriptions[0].status, 'active');       // still retrying: nothing changes
  await hook('subscription.halted'); assertEquals(db.tables.subscriptions[0].status, 'past_due');
  await hook('subscription.cancelled'); assertEquals(db.tables.subscriptions[0].status, 'cancelled');
  assertEquals(db.tables.subscriptions.length, 1);
  const before = JSON.stringify(db.tables.subscriptions);
  assertEquals((await hook('subscription.activated', undefined, { plan: 'yearly' })).status, 200);          // no user: ignored
  assertEquals((await hook('subscription.activated', undefined, { user_id: 'u9', plan: 'lifetime' })).status, 200);   // unknown plan: ignored
  assertEquals(JSON.stringify(db.tables.subscriptions), before);
});

const post = (name: string, body: any, token = 'good-token') => handlers[name](new Request('http://f', { method: 'POST', body: JSON.stringify(body), headers: { Authorization: 'Bearer ' + token } }));
Deno.test('payments webhook: a late message about an OLDER subscription never locks a paying member', async () => {
  resetDb();
  db.tables.subscriptions.push({ user_id: 'u9', plan: 'yearly', status: 'active', razorpay_subscription_id: 'sub_NEW' });
  const old = async (event: string) => { const body = JSON.stringify({ event, payload: { subscription: { entity: { id: 'sub_OLD', notes: { user_id: 'u9', plan: 'yearly' } } } } }); return handlers['razorpay-webhook'](new Request('http://f', { method: 'POST', body, headers: { 'x-razorpay-signature': await sign(body) } })); };
  for (const e of ['subscription.halted', 'subscription.cancelled', 'subscription.completed']) { await old(e); assertEquals(db.tables.subscriptions[0].status, 'active'); }
});
Deno.test('create-subscription: someone already subscribed is not charged twice', async () => {
  resetDb(); calls.length = 0; db.user = { id: 'u1', email: 'a@x.y' };
  db.tables.subscriptions.push({ user_id: 'u1', status: 'active', razorpay_subscription_id: 'sub_1' });
  assertEquals((await post('create-subscription', { plan: 'yearly' })).status, 409);
  assertEquals(calls.filter((c) => c.url.includes('razorpay')).length, 0);
});
Deno.test('delete-account removes every file even when there are more than 1000', async () => {
  resetDb(); db.user = { id: 'u1' }; db.files['photos/u1'] = Array.from({ length: 2500 }, (_, i) => `f${i}.jpg`);
  assertEquals((await post('delete-account', {})).status, 200);
  assertEquals(db.files['photos/u1'].length, 0);
});
Deno.test('create-subscription: needs sign-in, a known plan, and uses the right Razorpay plan', async () => {
  resetDb(); calls.length = 0; db.user = { id: 'u1', email: 'a@x.y' };
  assertEquals((await post('create-subscription', { plan: 'yearly' }, 'bad')).status, 401);
  assertEquals((await post('create-subscription', { plan: 'free' })).status, 400);
  const r = await post('create-subscription', { plan: 'monthly' }); assertEquals(r.status, 200);
  const out = await r.json(); assertEquals(out.subscription_id, 'sub_new'); assertEquals(out.key_id, 'rzp_test'); assert(!JSON.stringify(out).includes('secret'));
  const sent = JSON.parse(String(calls.find((c) => c.url.endsWith('/subscriptions'))!.init!.body)); assertEquals(sent.plan_id, 'plan_m'); assertEquals(sent.notes.user_id, 'u1');
});
Deno.test('cancel-subscription: only cancels the member\'s own plan, at the end of the period', async () => {
  resetDb(); calls.length = 0; db.user = { id: 'u1', email: 'a@x.y' };
  assertEquals((await post('cancel-subscription', {}, 'bad')).status, 401);
  assertEquals((await post('cancel-subscription', {})).status, 404);
  db.tables.subscriptions.push({ user_id: 'u1', razorpay_subscription_id: 'sub_1', status: 'active' });
  assertEquals((await post('cancel-subscription', {})).status, 200);
  const c = calls.find((x) => x.url.endsWith('/cancel'))!; assert(c.url.includes('sub_1')); assertEquals(JSON.parse(String(c.init!.body)).cancel_at_cycle_end, 1);
  razorpayOk = false; assertEquals((await post('cancel-subscription', {})).status, 502); razorpayOk = true;
});
Deno.test('delete-account: removes the signed-in member only', async () => {
  resetDb(); db.user = { id: 'u1' }; db.files['photos/u1'] = ['a.jpg']; db.files['voices/u1'] = ['a.webm']; db.files['photos/u2'] = ['b.jpg'];
  assertEquals((await post('delete-account', {}, 'bad')).status, 401);
  assertEquals((await post('delete-account', {})).status, 200);
  assertEquals(db.deleted, ['u1']); assertEquals(db.files['photos/u1'], []); assertEquals(db.files['voices/u1'], []); assertEquals(db.files['photos/u2'], ['b.jpg']);
});

// ---- Dodo Payments webhook ----
const U9 = '00000000-0000-4000-8000-000000000009';
async function dodoSign(id: string, ts: string, body: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode('dodo-secret-bytes'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${id}.${ts}.${body}`)))));
}
let dodoN = 0;
const dodo = async (type: string, data: any = {}, o: { sig?: string; ts?: string; at?: string } = {}) => {
  const body = JSON.stringify({ type, timestamp: o.at ?? new Date().toISOString(), data: { payload_type: 'Subscription', subscription_id: 'sub_d1', customer: { customer_id: 'cus_1' }, metadata: { user_id: U9, plan: 'monthly' }, next_billing_date: '2099-01-01T00:00:00Z', ...data } });
  const id = 'msg_' + ++dodoN, ts = o.ts ?? String(Math.floor(Date.now() / 1000));
  return handlers['dodo-webhook'](new Request('http://f', { method: 'POST', body, headers: { 'webhook-id': id, 'webhook-timestamp': ts, 'webhook-signature': 'v1,' + (o.sig ?? await dodoSign(id, ts, body)) } }));
};
Deno.test('dodo webhook: only a correctly signed, fresh message changes anything', async () => {
  resetDb();
  assertEquals((await dodo('subscription.active', {}, { sig: 'AAAA' })).status, 401);
  assertEquals((await dodo('subscription.active', {}, { ts: String(Math.floor(Date.now() / 1000) - 3600) })).status, 401);   // a replay of an old message
  assertEquals(db.tables.subscriptions.length, 0);
  assertEquals((await handlers['dodo-webhook'](new Request('http://f', { method: 'POST', body: '{}' }))).status, 401);
  assertEquals((await dodo('subscription.active')).status, 200);
  const s = db.tables.subscriptions[0];
  assertEquals([s.user_id, s.plan, s.status, s.provider, s.dodo_subscription_id], [U9, 'monthly', 'active', 'dodo', 'sub_d1']);
  assert(s.current_period_end.startsWith('2099-01-01'));
});
Deno.test('dodo webhook: renewals, trouble and the end of a subscription', async () => {
  resetDb(); let t = Date.now();
  const at = () => new Date(t += 1000).toISOString();
  await dodo('subscription.active', {}, { at: at() });
  await dodo('payment.succeeded', {}, { at: at() }); assertEquals(db.tables.subscriptions[0].status, 'active');
  await dodo('payment.succeeded', { subscription_id: undefined }, { at: at() });                          // a one-off payment: ignored
  await dodo('subscription.on_hold', {}, { at: at() }); assertEquals(db.tables.subscriptions[0].status, 'past_due');
  await dodo('subscription.renewed', {}, { at: at() }); assertEquals(db.tables.subscriptions[0].status, 'active');
  await dodo('subscription.cancelled', { cancel_at_next_billing_date: true }, { at: at() });          // cancelled, but paid until the end date
  assertEquals(db.tables.subscriptions[0].status, 'active');
  await dodo('subscription.cancelled', { cancel_at_next_billing_date: true, next_billing_date: '2000-01-01T00:00:00Z' }, { at: at() });   // end date has passed
  assertEquals(db.tables.subscriptions[0].status, 'cancelled');
  await dodo('subscription.active', {}, { at: at() }); await dodo('subscription.expired', {}, { at: at() });
  assertEquals(db.tables.subscriptions[0].status, 'cancelled'); assertEquals(db.tables.subscriptions.length, 1);
});
Deno.test('dodo webhook: late, unknown or incomplete messages never change a paying member', async () => {
  resetDb();
  const t0 = Date.now();
  await dodo('subscription.active', {}, { at: new Date(t0).toISOString() });
  await dodo('subscription.on_hold', {}, { at: new Date(t0 - 60000).toISOString() });                   // arrived late: it happened BEFORE the activation
  assertEquals(db.tables.subscriptions[0].status, 'active');
  await dodo('subscription.expired', { subscription_id: 'sub_OLD' }, { at: new Date(t0 + 1000).toISOString() });      // an older subscription
  await dodo('subscription.failed', { subscription_id: 'sub_NEVER' }, { at: new Date(t0 + 2000).toISOString() });     // one we never saved
  assertEquals(db.tables.subscriptions[0].status, 'active'); assertEquals(db.tables.subscriptions.length, 1);
  resetDb();
  await dodo('subscription.active', { metadata: { plan: 'monthly' } });                                   // no member
  await dodo('subscription.active', { metadata: { user_id: U9, plan: 'lifetime' }, product_id: 'pdt_x' }); // unknown plan
  await dodo('subscription.active', { metadata: { user_id: 'not-a-uuid', plan: 'monthly' } });
  assertEquals(db.tables.subscriptions.length, 0);
  await dodo('subscription.active', { metadata: { user_id: U9 }, product_id: 'pdt_y' });                  // plan found from the product
  assertEquals(db.tables.subscriptions[0].plan, 'yearly');
});

// ---- Dodo checkout and cancel ----
Deno.test('dodo checkout: says "opening soon" until keys exist, then returns the hosted page for the right product', async () => {
  resetDb(); calls.length = 0; db.user = { id: 'u1', email: 'a@x.y' };
  assertEquals((await post('create-dodo-checkout', { plan: 'yearly' }, 'bad')).status, 401);
  assertEquals((await post('create-dodo-checkout', { plan: 'free' })).status, 400);
  assertEquals((await post('create-dodo-checkout', { plan: 'yearly' })).status, 503);          // no API key yet
  Deno.env.set('DODO_API_KEY', 'k');
  db.tables.subscriptions.push({ user_id: 'u1', status: 'active', dodo_subscription_id: 'sub_d1' });
  assertEquals((await post('create-dodo-checkout', { plan: 'yearly' })).status, 409);          // never charge twice
  db.tables.subscriptions.length = 0;
  const r = await post('create-dodo-checkout', { plan: 'yearly' }); assertEquals(r.status, 200);
  assert((await r.json()).checkout_url.startsWith('https://'));
  const c = calls.find((x) => x.url.endsWith('/checkouts'))!; const sent = JSON.parse(String(c.init!.body));
  assertEquals(sent.product_cart[0].product_id, 'pdt_y'); assertEquals(sent.metadata, { user_id: 'u1', plan: 'yearly' });
  assert(c.url.startsWith('https://test.dodopayments.com'));
});
Deno.test('dodo cancel: stops renewals at the end of the period', async () => {
  resetDb(); calls.length = 0; db.user = { id: 'u1', email: 'a@x.y' };
  assertEquals((await post('cancel-dodo-subscription', {})).status, 404);
  db.tables.subscriptions.push({ user_id: 'u1', status: 'active', dodo_subscription_id: 'sub_d1' });
  assertEquals((await post('cancel-dodo-subscription', {})).status, 200);
  const c = calls.find((x) => x.url.endsWith('/subscriptions/sub_d1'))!;
  assertEquals(c.init!.method, 'PATCH'); assertEquals(JSON.parse(String(c.init!.body)), { cancel_at_next_billing_date: true });
});

// ---- Speak instead of typing ----
Deno.test('transcribe: needs sign-in, says "opening soon" without a key, then returns the words', async () => {
  resetDb(); calls.length = 0; db.user = { id: 'u1', email: 'a@x.y' };
  const send = (token: string, f?: File) => { const fd = new FormData(); if (f) fd.append('audio', f); return handlers['transcribe'](new Request('http://f', { method: 'POST', body: fd, headers: { Authorization: 'Bearer ' + token } })); };
  const clip = new File([new Uint8Array(500)], 'speech.webm', { type: 'audio/webm' });
  assertEquals((await send('bad', clip)).status, 401);
  assertEquals((await send('good-token', clip)).status, 503);
  Deno.env.set('OPENAI_API_KEY', 'k');
  assertEquals((await send('good-token')).status, 400);
  assertEquals((await send('good-token', new File([new Uint8Array(4 * 1024 * 1024)], 'big.webm'))).status, 413);
  const r = await send('good-token', clip); assertEquals(r.status, 200); assertEquals((await r.json()).text, 'Hello there');
});
