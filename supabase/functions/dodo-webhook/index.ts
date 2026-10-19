// Dodo Payments tells us here when a subscription starts, renews, is cancelled or a payment fails.
// In the Dodo dashboard (Developer, Webhooks) add this function's URL and store the endpoint's signing secret as DODO_WEBHOOK_SECRET.
// The checkout we create passes { user_id, plan } as metadata, which comes back on every event, so we know whose subscription it is.
import { admin, json } from '../_shared/common.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ACTIVE = ['subscription.active', 'subscription.renewed', 'subscription.plan_changed', 'payment.succeeded'];
const TROUBLE = ['subscription.on_hold', 'subscription.past_due', 'subscription.failed'];
const ENDED = ['subscription.cancelled', 'subscription.expired'];

const same = (a: string, b: string) => { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; };

// Standard Webhooks: signature = base64(HMAC-SHA256(secret, `${id}.${timestamp}.${body}`)), sent as "v1,<signature>" (several may be listed).
async function validSignature(body: string, id: string | null, ts: string | null, header: string | null) {
  const secret = Deno.env.get('DODO_WEBHOOK_SECRET');
  if (!secret || !id || !ts || !header) return false;
  if (!(Math.abs(Date.now() / 1000 - Number(ts)) <= 300)) return false;               // old or future-dated messages are replays
  let raw: Uint8Array;
  try { raw = Uint8Array.from(atob(secret.replace(/^whsec_/, '')), (c) => c.charCodeAt(0)); } catch { return false; }
  const key = await crypto.subtle.importKey('raw', raw, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${id}.${ts}.${body}`)));
  const expected = btoa(String.fromCharCode(...mac));
  return header.split(' ').some((part) => { const [v, sig] = part.split(','); return v === 'v1' && !!sig && same(sig, expected); });
}

const iso = (v: unknown) => { const d = v ? new Date(String(v)) : null; return d && !isNaN(d.getTime()) ? d.toISOString() : null; };

Deno.serve(async (req) => {
  const body = await req.text();
  if (!(await validSignature(body, req.headers.get('webhook-id'), req.headers.get('webhook-timestamp'), req.headers.get('webhook-signature')))) return json({ error: 'bad signature' }, 401);
  let evt: any;
  try { evt = JSON.parse(body); } catch { return json({ error: 'bad body' }, 400); }
  const type: string = evt?.type, data = evt?.data ?? {};
  const subId: string | undefined = data.subscription_id;
  if (!subId || ![...ACTIVE, ...TROUBLE, ...ENDED].includes(type)) return json({ ok: true, ignored: true });   // e.g. a one-off payment, refunds, disputes

  const eventAt = iso(evt.timestamp) ?? new Date().toISOString();
  const periodEnd = iso(data.next_billing_date) ?? iso(data.expires_at);
  const { data: current } = await admin.from('subscriptions').select('*').eq('dodo_subscription_id', subId).maybeSingle();
  if (current?.last_event_at && eventAt < current.last_event_at) return json({ ok: true, ignored: 'older message' });   // messages can arrive out of order

  if (ACTIVE.includes(type)) {
    const userId = data.metadata?.user_id ?? current?.user_id;
    const plan = data.metadata?.plan ?? current?.plan ?? (data.product_id === Deno.env.get('DODO_PRODUCT_YEARLY') ? 'yearly' : data.product_id === Deno.env.get('DODO_PRODUCT_MONTHLY') ? 'monthly' : null);
    if (!UUID.test(String(userId ?? '')) || !['monthly', 'yearly'].includes(String(plan))) return json({ ok: true, ignored: 'unknown member or plan' });
    const { error } = await admin.from('subscriptions').upsert({
      user_id: userId, plan, status: 'active', provider: 'dodo', dodo_subscription_id: subId, dodo_customer_id: data.customer?.customer_id ?? current?.dodo_customer_id ?? null,
      current_period_end: periodEnd ?? current?.current_period_end ?? null, last_event_at: eventAt, updated_at: new Date().toISOString(),
    });                                                                          // the newest paid subscription is the current one
    if (error) return json({ error: 'could not save' }, 500);                    // Dodo tries again later
    return json({ ok: true });
  }

  // Everything else only matters for the subscription we hold. A late message about an older or unknown one changes nothing.
  if (!current) return json({ ok: true, ignored: 'not on file' });
  let status = 'past_due';
  if (ENDED.includes(type)) {
    // "Cancel" keeps access until the period they paid for ends: Dodo may say cancelled while the end date is still ahead.
    const stillPaid = type === 'subscription.cancelled' && data.cancel_at_next_billing_date && periodEnd && periodEnd > new Date().toISOString();
    status = stillPaid ? 'active' : 'cancelled';
  }
  const { error } = await admin.from('subscriptions').upsert({ ...current, status, current_period_end: periodEnd ?? current.current_period_end ?? null, last_event_at: eventAt, updated_at: new Date().toISOString() });
  if (error) return json({ error: 'could not save' }, 500);
  return json({ ok: true });
});
