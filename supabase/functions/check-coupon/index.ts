// The "Apply" button on the checkout page: checks a coupon code with Dodo and says how much the member saves.
// Nothing is charged here; the code is applied for real when the member pays (create-dodo-checkout).
import { createClient } from 'npm:@supabase/supabase-js@2';
import { json } from '../_shared/common.ts';
import { resolveCoupon, tidyCode, validCode } from '../_shared/coupons.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return json({});
  const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return json({ error: 'sign in first' }, 401);
  const { plan, coupon, region } = await req.json().catch(() => ({}));
  if (!['monthly', 'yearly'].includes(plan)) return json({ error: 'unknown plan' }, 400);
  const code = tidyCode(coupon);
  if (!validCode(code)) return json({ error: 'That code doesn’t look right. Check it and try again.' }, 400);
  const apiKey = Deno.env.get('DODO_API_KEY');
  const product = Deno.env.get(plan === 'monthly' ? 'DODO_PRODUCT_MONTHLY' : 'DODO_PRODUCT_YEARLY');
  if (!apiKey || !product) return json({ error: 'Payments are opening soon.', code: 'not_configured' }, 503);
  const base = Deno.env.get('DODO_ENV') === 'live' ? 'https://live.dodopayments.com' : 'https://test.dodopayments.com';
  try {
    const r = await resolveCoupon(code, plan, region, base, apiKey, product);
    if (!r.ok) return json({ error: r.error }, r.status);
    return json({ code, saving: r.saving, price: r.price, total: r.total, currency: r.currency });
  } catch (e) {
    console.error('Coupon check failed', String(e));
    return json({ error: 'We couldn’t check that code right now. Please try again.' }, 502);
  }
});
