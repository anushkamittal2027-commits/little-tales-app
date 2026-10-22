// Settings that change between "on this phone" and "online". Fill these in when the accounts exist (see docs/BACKEND_PLAN.md).
// The Supabase URL, the anon key and the VAPID public key are meant to be public. Never put secret keys here.
export const CONFIG = {
  SUPABASE_URL: 'https://vnorlnjsvknhsvjfczyl.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZub3JsbmpzdmtuaHN2amZjenlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxNDQ4MjIsImV4cCI6MjEwNzcyMDgyMn0.CPu0W18FmAxPnfaqqJHMZ6PtNsGBnEzFpF7ZBFmIxtk',
  VAPID_PUBLIC_KEY: 'BH3ytCLodzzZpbkk9xAVl3f0bJ6MLIbITSDMGMrzXmszQYGfcm_zW6P5SG2HbIBhjsh1kgIL1jGFKG2l_nsCyfw',
};
// Practice mode (no server) is forced by tests and the private preview, or by adding ?demo=1 to the address.
const forceDemo = typeof window !== 'undefined' && (window.__DEMO_AUTH || /[?&]demo=1/.test(location.search));
export const ONLINE = !forceDemo && !!(CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY);

export const APP_VERSION = 'v3 · ' + new Date().toISOString().slice(0, 10);
// How many digits the emailed sign-in code has. Supabase's default is 8 (Authentication, Providers, Email, "Email OTP Length"). Keep the two the same.
export const CODE_LENGTH = 6;
// Emails allowed to open the hidden founder panel (tap the logo 5 times) on the live site. Everyone else never sees it.
export const FOUNDER_EMAILS = ['hellolittletales@gmail.com'];
// The one real address of the app. Visitors who arrive on the old free address are moved here, so everyone shares one saved sign-in.
export const CANONICAL_ORIGIN = 'https://littletales.me';
// Google's "Client ID" (public, ends in .apps.googleusercontent.com). When filled in, the sign-in screen shows Google's own button, which says "Little Tales"
// instead of the supabase.co address. Leave empty to keep the old redirect button.
export const GOOGLE_CLIENT_ID = '';
// Microsoft Clarity (anonymous usage recordings and heatmaps). Only loaded on the real website, never on localhost or in tests.
export const CLARITY_ID = 'yzzxnf3q1w';
// Which company takes the payments: 'dodo' (Dodo Payments, hosted checkout page) or 'razorpay' (older, India only).
export const PAYMENT_PROVIDER = 'dodo';
// Sentry error reporting (free). Paste the project's DSN here (it is public, not secret) and the live site will report crashes to Sentry. Empty = off.
export const SENTRY_DSN = '';
// Sentry's "Loader Script" key (the 32 characters in https://js.sentry-cdn.com/<key>.min.js). Public, not secret. Used when SENTRY_DSN is empty.
export const SENTRY_KEY = 'b60fce93fa1803baa9280be80a3275ca';
