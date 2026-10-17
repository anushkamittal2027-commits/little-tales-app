// Real payments with Razorpay (UPI AutoPay or card). The server creates the subscription (supabase/functions/create-subscription),
// Razorpay's own window takes the payment (we never see card or UPI details), and the server webhook marks the member as subscribed.
import { client, auth } from './auth.js';
import { pullAccount, pullTales } from './sync.js';
import { account } from './account.js';

const loadScript = () => new Promise((res, rej) => {
  if (window.Razorpay) return res();
  const s = document.createElement('script'); s.src = 'https://checkout.razorpay.com/v1/checkout.js';
  s.onload = res; s.onerror = () => rej(new Error('Could not open the payment window. Check your internet and try again.')); document.head.append(s);
});

// Resolves 'paid' when the member is subscribed, 'closed' if they closed the window, or throws a readable error.
export async function payOnline(planId) {
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
  const { data, error } = await c.functions.invoke('cancel-subscription');
  if (error || data?.error) throw new Error(data?.error || 'We couldn’t cancel right now. Please try again.');
}
