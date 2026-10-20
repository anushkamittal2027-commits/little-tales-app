// "Cancel subscription": stops renewals at Dodo Payments. The member keeps access until the end of the period they paid for.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { admin, json } from '../_shared/common.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return json({});
  const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return json({ error: 'sign in first' }, 401);
  const { data: sub } = await admin.from('subscriptions').select('dodo_subscription_id').eq('user_id', user.id).maybeSingle();
  if (!sub?.dodo_subscription_id) return json({ error: 'no active subscription' }, 404);
  const apiKey = Deno.env.get('DODO_API_KEY');
  if (!apiKey) return json({ error: 'Payments are opening soon.', code: 'not_configured' }, 503);
  const base = Deno.env.get('DODO_ENV') === 'live' ? 'https://live.dodopayments.com' : 'https://test.dodopayments.com';
  const r = await fetch(`${base}/subscriptions/${sub.dodo_subscription_id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ cancel_at_next_billing_date: true }),
  });
  if (!r.ok) return json({ error: 'We couldn’t cancel right now. Please try again.' }, 502);
  return json({ ok: true });  // the webhook marks it ended when the period ends
});
