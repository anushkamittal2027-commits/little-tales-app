// Razorpay tells us here when a payment succeeds, a subscription is cancelled, or a payment fails.
// Set this function's URL as the webhook in the Razorpay dashboard, with a secret you also store as RAZORPAY_WEBHOOK_SECRET.
import { admin, json } from '../_shared/common.ts';

async function validSignature(body: string, signature: string | null) {
  if (!signature) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(Deno.env.get('RAZORPAY_WEBHOOK_SECRET')!), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body)));
  const hex = [...mac].map((b) => b.toString(16).padStart(2, '0')).join('');
  return hex === signature;
}

Deno.serve(async (req) => {
  const body = await req.text();
  if (!(await validSignature(body, req.headers.get('x-razorpay-signature')))) return json({ error: 'bad signature' }, 401);
  const evt = JSON.parse(body);
  const sub = evt?.payload?.subscription?.entity;
  const userId = sub?.notes?.user_id, plan = sub?.notes?.plan;
  if (!userId || !['monthly', 'yearly'].includes(plan)) return json({ ok: true, ignored: true });

  const periodEnd = sub.current_end ? new Date(sub.current_end * 1000).toISOString() : null;
  const base = { user_id: userId, plan, razorpay_subscription_id: sub.id, razorpay_customer_id: sub.customer_id ?? null, current_period_end: periodEnd, updated_at: new Date().toISOString() };
  if (['subscription.activated', 'subscription.charged', 'subscription.resumed'].includes(evt.event)) {
    await admin.from('subscriptions').upsert({ ...base, status: 'active' });          // the newest paid subscription is the current one
    return json({ ok: true });
  }
  // Anything else is only about the subscription we currently have on file. A late message about an OLDER subscription must not lock a paying member.
  const { data: current } = await admin.from('subscriptions').select('razorpay_subscription_id').eq('user_id', userId).maybeSingle();
  if (current?.razorpay_subscription_id && current.razorpay_subscription_id !== sub.id) return json({ ok: true, ignored: 'older subscription' });
  if (['subscription.cancelled', 'subscription.completed', 'subscription.expired'].includes(evt.event)) {
    await admin.from('subscriptions').upsert({ ...base, status: 'cancelled' });
  } else if (evt.event === 'subscription.halted') {
    await admin.from('subscriptions').upsert({ ...base, status: 'past_due' });         // Razorpay has given up collecting. ("pending" only means it is still retrying, so we change nothing.)
  }
  return json({ ok: true });
});
