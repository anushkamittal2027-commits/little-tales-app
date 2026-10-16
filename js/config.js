// Settings that change between "on this phone" and "online". Fill these in when the accounts exist (see docs/BACKEND_PLAN.md).
// The Supabase URL, the anon key and the VAPID public key are meant to be public. Never put secret keys here.
export const CONFIG = {
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',
  VAPID_PUBLIC_KEY: '',
};
export const ONLINE = !!(CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY);
