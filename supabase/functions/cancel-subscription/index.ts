// "Cancel subscription": stops renewals at Razorpay. The member keeps access until the end of the period they paid for.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { admin, json } from '../_shared/common.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return json({});
  const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return json({ error: 'sign in first' }, 401);
  const { data: sub } = await admin.from('subscriptions').select('razorpay_subscription_id').eq('user_id', user.id).maybeSingle();
  if (!sub?.razorpay_subscription_id) return json({ error: 'no active subscription' }, 404);
  const keyId = Deno.env.get('RAZORPAY_KEY_ID')!, secret = Deno.env.get('RAZORPAY_KEY_SECRET')!;
  const r = await fetch(`https://api.razorpay.com/v1/subscriptions/${sub.razorpay_subscription_id}/cancel`, {
    method: 'POST',
    headers: { Authorization: 'Basic ' + btoa(`${keyId}:${secret}`), 'Content-Type': 'application/json' },
    body: JSON.stringify({ cancel_at_cycle_end: 1 }),
  });
  if (!r.ok) return json({ error: (await r.json().catch(() => ({})))?.error?.description ?? 'payment provider error' }, 502);
  return json({ ok: true });  // the webhook marks it cancelled when the period ends
});
