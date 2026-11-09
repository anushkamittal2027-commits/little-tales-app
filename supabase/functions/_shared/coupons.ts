// Coupon codes live in Dodo (Live, Discounts). One code a person types can cover both plans: if the code itself is
// not for the chosen plan, we try the same code with a "Y" on the end for the yearly plan (SAVEIN -> SAVEINY).
// metadata.region on a Dodo discount ('in' or 'intl') keeps a code to India or to everyone else.

// Must match PRICES in js/account.js and the products in Dodo.
export const PRICES: Record<string, { currency: string; monthly: number; yearly: number }> = {
  in: { currency: 'INR', monthly: 18900, yearly: 144000 },     // smallest unit (paise)
  intl: { currency: 'USD', monthly: 600, yearly: 6000 },       // cents
};

export const tidyCode = (c: unknown) => (typeof c === 'string' ? c.trim().toUpperCase() : '');
export const validCode = (c: string) => /^[A-Z0-9_-]{3,32}$/.test(c);

type Result = { ok: true; dodoCode: string; price: number; saving: number; total: number; currency: string } | { ok: false; error: string; status: number };

export async function resolveCoupon(code: string, plan: 'monthly' | 'yearly', region: string, base: string, apiKey: string, product: string): Promise<Result> {
  const reg = region === 'in' ? 'in' : 'intl';
  const p = PRICES[reg]; const price = p[plan];
  const nope = (error: string, status = 400): Result => ({ ok: false, error, status });
  const get = async (c: string) => {
    const r = await fetch(`${base}/discounts/code/${encodeURIComponent(c)}`, { headers: { Authorization: `Bearer ${apiKey}` } });
    if (r.status === 404) return null;
    if (!r.ok) throw new Error('dodo_' + r.status);
    return await r.json();
  };
  let d = await get(code);
  if (!d) return nope('We couldn’t find that code. Check the spelling and try again.', 404);
  if (d.restricted_to?.length && !d.restricted_to.includes(product)) {
    const alt = plan === 'yearly' ? await get(code + 'Y') : null;
    if (alt && (!alt.restricted_to?.length || alt.restricted_to.includes(product))) d = alt;
    else return nope(plan === 'yearly' ? 'This code works on the monthly plan only.' : 'This code works on the yearly plan only.');
  }
  const now = new Date().toISOString();
  if (d.expires_at && d.expires_at < now) return nope('This code has expired.');
  if (d.starts_at && d.starts_at > now) return nope('This code isn’t active yet.');
  if (d.usage_limit != null && d.times_used >= d.usage_limit) return nope('This code has been fully used.');
  const want = d.metadata?.region;
  if (want && want !== reg) return nope(want === 'in' ? 'This code is for India. Try the code we gave you for your country.' : 'This code is for people outside India. Try the code we gave you for India.');
  const row = (d.currency_options ?? []).find((o: any) => o.currency === p.currency);
  let saving = 0;
  if (d.type === 'percentage') {
    saving = Math.round(price * d.amount / 10000);
    if (row?.max_amount_possible) saving = Math.min(saving, row.max_amount_possible);
  } else {
    if (!row?.max_amount_possible) return nope('This code can’t be used in your currency.');
    saving = row.max_amount_possible;
  }
  saving = Math.min(saving, price);
  return { ok: true, dodoCode: d.code, price, saving, total: price - saving, currency: p.currency };
}
