// Real payments with Razorpay (UPI AutoPay or card). The server creates the subscription (supabase/functions/create-subscription),
// Razorpay's own window takes the payment (we never see card or UPI details), and the server webhook marks the member as subscribed.
import { client, auth } from './auth.js';
import { pullAccount, pullTales } from './sync.js';
import { account } from './account.js';
import { PAYMENT_PROVIDER } from './config.js';

const loadScript = () => new Promise((res, rej) => {
  if (window.Razorpay) return res();
  const s = document.createElement('script'); s.src = 'https://checkout.razorpay.com/v1/checkout.js';
  s.onload = res; s.onerror = () => rej(new Error('Could not open the payment window. Check your internet and try again.')); document.head.append(s);
});

// Resolves 'paid' when the member is subscribed, 'closed' if they closed the window, or throws a readable error.
export async function payOnline(planId) {
  if (PAYMENT_PROVIDER === 'dodo') return payDodo(planId);
  const c = await client();
  const { data, error } = await c.functions.invoke('create-subscription', { body: { plan: planId } });
  if (error || !data?.subscription_id) throw new Error(data?.error || 'We couldn’t start the payment. Please try again in a moment.');
  await loadScript();
  const paid = await new Promise((resolve, reject) => {
    const rz = new window.Razorpay({
      key: data.key_id, subscription_id: data.subscription_id, name: 'Little Tales', description: planId === 'yearly' ? 'Yearly plan' : 'Monthly plan',
      prefill: { email: auth.user?.email || '' }, theme: { color: '#FF4FA3' },
      handler: () => resolve(true),
      modal: { ondismiss: () => resolve(false) },
    });
    rz.on?.('payment.failed', (r) => reject(new Error(r?.error?.description || 'The payment didn’t go through. You haven’t been charged.')));
    rz.open();
  });
  if (!paid) return 'closed';
  // The webhook can take a few seconds to arrive.
  for (let i = 0; i < 15; i++) {
    await pullAccount();
    if (account.subscription) { pullTales().catch(() => {}); return 'paid'; }   // locked tales come back now, not at the next start
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error('Your payment is being confirmed. Your tales will unlock within a minute. Reopen the app if it doesn’t.');
}

export async function cancelOnline() {
  const c = await client();
  const { data, error } = await c.functions.invoke(PAYMENT_PROVIDER === 'dodo' ? 'cancel-dodo-subscription' : 'cancel-subscription');
  if (error || data?.error) throw new Error(data?.error || 'We couldn’t cancel right now. Please try again.');
}

// Dodo Payments: the member pays on Dodo's own page and comes back to /?paid=1; the webhook then marks them subscribed.
async function payDodo(planId) {
  const c = await client();
  const { data, error } = await c.functions.invoke('create-dodo-checkout', { body: { plan: planId } });
  let msg = data?.error, code = data?.code;
  if (!msg && error?.context?.json) { const b = await error.context.json().catch(() => null); msg = b?.error; code = b?.code; }
  if (error || !data?.checkout_url) throw new Error((msg || 'We couldn’t start the payment. Please try again in a moment.') + (code ? ` (${code})` : ''));
  location.assign(data.checkout_url);
  return new Promise(() => {});          // the page is leaving; nothing more to do here
}

// Called on start when Dodo has sent the member back. The payment company tells our server a moment after the payment,
// so keep checking for up to two minutes. Returns true once the subscription shows up, false if it has not yet.
export async function finishDodoReturn(onWaiting) {
  if (!/[?&]paid=1/.test(location.search)) return null;
  try { history.replaceState(null, '', location.pathname); } catch {}
  onWaiting?.(true);
  for (let i = 0; i < 40; i++) {
    await pullAccount();
    if (account.subscription) { onWaiting?.(false); pullTales().catch(() => {}); return true; }
    await new Promise((r) => setTimeout(r, 3000));
  }
  onWaiting?.(false);
  return false;
}
