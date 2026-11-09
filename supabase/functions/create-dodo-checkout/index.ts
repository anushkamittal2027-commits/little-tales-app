// The app calls this when a member taps "Continue" on a plan. It asks Dodo Payments for a hosted checkout page
// and returns its address; the member pays there (we never see card details) and Dodo's webhook marks them subscribed.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { admin, json } from '../_shared/common.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return json({});
  const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return json({ error: 'sign in first' }, 401);
  const { plan, coupon } = await req.json().catch(() => ({}));
  if (!['monthly', 'yearly'].includes(plan)) return json({ error: 'unknown plan' }, 400);
  // Coupon codes are made in Dodo (Discounts). We only pass a tidy code on; Dodo checks it and shows the discount.
  const code = typeof coupon === 'string' ? coupon.trim().toUpperCase() : '';
  if (code && !/^[A-Z0-9_-]{3,32}$/.test(code)) return json({ error: 'That coupon code doesn’t look right.', code: 'bad_coupon' }, 400);

  const apiKey = Deno.env.get('DODO_API_KEY');
  const product = Deno.env.get(plan === 'monthly' ? 'DODO_PRODUCT_MONTHLY' : 'DODO_PRODUCT_YEARLY');
  if (!apiKey || !product) return json({ error: 'Payments are opening soon. Please try again in a little while.', code: 'not_configured' }, 503);

  const { data: have } = await admin.from('subscriptions').select('status').eq('user_id', user.id).maybeSingle();
  if (have?.status === 'active') return json({ error: 'You are already subscribed.' }, 409);   // never charge twice

  const base = Deno.env.get('DODO_ENV') === 'live' ? 'https://live.dodopayments.com' : 'https://test.dodopayments.com';
  const origin = Deno.env.get('APP_ORIGIN') ?? 'https://littletales.me';
  const r = await fetch(`${base}/checkouts`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      product_cart: [{ product_id: product, quantity: 1 }],
      customer: { email: user.email },
      return_url: `${origin}/?paid=1`,
      metadata: { user_id: user.id, plan, ...(code ? { coupon: code } : {}) },
      ...(code ? { discount_codes: [code] } : {}),
    }),
  });
  const out = await r.json().catch(() => ({}));
  if (!r.ok || !out.checkout_url) {
    if (code && r.status >= 400 && r.status < 500) {
      console.error('Dodo refused coupon', code, r.status, JSON.stringify(out).slice(0, 300));
      return json({ error: 'That coupon code didn’t work. It may be mistyped, used up or expired.', code: 'coupon_' + r.status }, 400);
    }
    console.error('Dodo checkout failed', r.status, JSON.stringify(out).slice(0, 400));   // visible in Supabase, Edge Functions, Logs
    return json({ error: 'We couldn’t start the payment. Please try again in a moment.', code: 'dodo_' + r.status }, 502);
  }
  return json({ checkout_url: out.checkout_url });
});
