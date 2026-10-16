// The app calls this when a member taps "Continue" on a plan. It creates a Razorpay subscription
// (UPI AutoPay or card) and returns what the checkout needs. Prices (and GST) live in the Razorpay plans.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { json } from '../_shared/common.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return json({});
  const auth = req.headers.get('Authorization') ?? '';
  const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return json({ error: 'sign in first' }, 401);
  const { plan } = await req.json().catch(() => ({}));
  if (!['monthly', 'yearly'].includes(plan)) return json({ error: 'unknown plan' }, 400);

  const keyId = Deno.env.get('RAZORPAY_KEY_ID')!, secret = Deno.env.get('RAZORPAY_KEY_SECRET')!;
  const planId = Deno.env.get(plan === 'monthly' ? 'RAZORPAY_PLAN_MONTHLY' : 'RAZORPAY_PLAN_YEARLY')!;
  const r = await fetch('https://api.razorpay.com/v1/subscriptions', {
    method: 'POST',
    headers: { Authorization: 'Basic ' + btoa(`${keyId}:${secret}`), 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan_id: planId, total_count: plan === 'monthly' ? 120 : 10, customer_notify: 1, notes: { user_id: user.id, plan } }),
  });
  const sub = await r.json();
  if (!r.ok) return json({ error: sub?.error?.description ?? 'payment provider error' }, 502);
  return json({ subscription_id: sub.id, key_id: keyId, short_url: sub.short_url });
});
