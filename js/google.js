// Google's own "Continue with Google" button (Google Identity Services). It shows the app's name, not the supabase.co address.
import { GOOGLE_CLIENT_ID } from './config.js';
const clientId = () => window.__GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID;

let loading = null;
const loadGsi = () => (loading ||= new Promise((res, rej) => {
  if (window.google?.accounts?.id) return res();
  const t = setTimeout(() => { loading = null; rej(new Error('Google took too long')); }, 6000);
  const s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true;
  s.onload = () => { clearTimeout(t); res(); };
  s.onerror = () => { clearTimeout(t); loading = null; rej(new Error('Google could not be reached')); };
  document.head.append(s);
}));
const sha256hex = async (str) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str)))].map((b) => b.toString(16).padStart(2, '0')).join('');

// Draws Google's button into `el`. onToken(idToken, rawNonce) runs when the member picks an account.
export async function renderGoogleButton(el, onToken) {
  await loadGsi();
  const raw = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random())) + Date.now();
  const hashed = await sha256hex(raw);                    // Google gets the hashed nonce, Supabase the raw one: that is how it checks the token is fresh
  window.google.accounts.id.initialize({ client_id: clientId(), nonce: hashed, ux_mode: 'popup', auto_select: false, itp_support: true, callback: (r) => onToken(r.credential, raw) });
  window.google.accounts.id.renderButton(el, { type: 'standard', theme: 'outline', size: 'large', text: 'continue_with', shape: 'pill', logo_alignment: 'left', width: Math.min(340, el.clientWidth || 320) });
}
