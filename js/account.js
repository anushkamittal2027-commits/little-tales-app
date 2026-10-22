// The member's account, trial and subscription. Stored on this phone for now;
// Stage 3 moves the same fields online (the rest of the app only calls these functions).
import { store } from './store.js';
import { todayStr, daysBetween, addDays, setDayOffset, toDateStr } from './util.js';

export const TRIAL_DAYS = 7;
export const HOLD_DAYS = 30;
export const PLANS = {
  monthly: { id: 'monthly', name: 'Monthly', price: 149, per: 'month', note: 'Billed every month' },
  yearly: { id: 'yearly', name: 'Yearly', price: 999, per: 'year', note: 'About Rs 83 a month', best: true },
};

const DEFAULT = {
  consented: false, firstSignIn: null,
  subscription: null,            // { plan, since }
  day7Shown: false,              // the Day 7 video + paywall has been shown
  videos: {},                    // key -> true when watched
  notify: { granted: false, asked: false },
  installHinted: false,
  introSeen: false,
  memberWelcomed: false,         // the welcome-to-the-family celebration has been shown
  celebratedFirst: false,        // the first-tale celebration has been shown
  milestones: [],                // streak milestones already celebrated
  settings: { gst: false, sound: true },      // founder-only: show "+ GST" prices once registered
  dayOffset: 0,                  // founder-only time travel
};
export const account = { ...structuredClone(DEFAULT) };

export async function loadAccount() {
  const saved = await store.getMeta('account');
  Object.assign(account, structuredClone(DEFAULT), saved || {});
  account.settings = { ...DEFAULT.settings, ...(account.settings || {}) };
  setDayOffset(account.dayOffset || 0);
  return account;
}
export async function saveAccount() { await store.setMeta('account', JSON.parse(JSON.stringify(account))); }
export async function patchAccount(p) { Object.assign(account, p); await saveAccount(); }

export const hooks = {};   // online saving plugs in here (js/sync.js)
export async function startTrial() {
  if (!account.firstSignIn) account.firstSignIn = todayStr();
  account.consented = true;
  await saveAccount();
  await hooks.startTrial?.();   // online: the server decides the dates (and may correct them)
}

// What state is this member in today?
//  new | trial | day7 | locked | deleted | subscribed
export function trialInfo() {
  const today = todayStr();
  if (!account.consented || !account.firstSignIn) return { status: 'new', day: 0, left: TRIAL_DAYS };
  const day = daysBetween(account.firstSignIn, today) + 1;
  if (account.subscription) return { status: 'subscribed', day, plan: account.subscription.plan };
  if (day < TRIAL_DAYS) return { status: 'trial', day, left: TRIAL_DAYS - day + 1 };
  if (day === TRIAL_DAYS) return { status: 'day7', day, left: 1 };
  const lockedDays = day - TRIAL_DAYS;          // 1 on the first locked day
  const holdLeft = HOLD_DAYS - (lockedDays - 1);
  if (holdLeft <= 0) return { status: 'deleted', day, holdLeft: 0 };
  return { status: 'locked', day, holdLeft };
}
export const isLocked = () => ['locked', 'deleted'].includes(trialInfo().status);

export async function subscribe(plan) {
  account.subscription = { plan, since: todayStr() };
  await saveAccount();
}
export async function cancelSubscription() { account.subscription = null; await saveAccount(); }

// Founder-only: jump to any state by moving "today" relative to the first sign-in.
export async function jumpTo(state) {
  const base = account.firstSignIn || todayStr();
  const real = toDateStr(new Date());
  const targetDay = { day1: 1, day4: 4, day7: 7, locked: 8, locked25: 33, deleted: 38 }[state];
  if (state === 'subscribed') { account.subscription = account.subscription || { plan: 'yearly', since: real }; }
  else {
    account.subscription = null;
    const wantToday = addDays(base, targetDay - 1);
    const delta = daysBetween(real, wantToday);
    account.dayOffset = delta;
    setDayOffset(delta);
    if (state === 'day7') account.day7Shown = false;
  }
  await saveAccount();
}
export async function resetAccountLocal() {
  Object.assign(account, structuredClone(DEFAULT));
  setDayOffset(0);
  await saveAccount();
}
export async function resetDemo() {
  Object.assign(account, structuredClone(DEFAULT));
  setDayOffset(0);
  await saveAccount();
}

// Deleting after the 30-day hold, or when someone deletes their account.
export async function purgeAllTales() { await store.clear(); }
