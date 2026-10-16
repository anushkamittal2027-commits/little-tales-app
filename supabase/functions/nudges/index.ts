// Runs every hour. Sends "Anything worth keeping today?" around 1pm and a gentle second nudge around 8pm,
// in each member's own time zone. Skips the 8pm nudge if they already kept a tale today.
import webpush from 'npm:web-push@3.6.7';
import { admin, isScheduler, json, localParts, firstTime } from '../_shared/common.ts';

webpush.setVapidDetails('mailto:hellolittletales@gmail.com', Deno.env.get('VAPID_PUBLIC_KEY')!, Deno.env.get('VAPID_PRIVATE_KEY')!);

const COPY: Record<string, { title: string; body: string }> = {
  'nudge-13': { title: 'Little Tales', body: 'Anything worth keeping today?' },
  'nudge-20': { title: 'Today counts.', body: 'One little tale before the day ends?' },
};

Deno.serve(async (req) => {
  if (!isScheduler(req)) return json({ error: 'not allowed' }, 401);
  const { data: members } = await admin.from('profiles').select('id, tz').eq('notify_push', true);
  let sent = 0;
  for (const m of members ?? []) {
    const { date, hour } = localParts(m.tz);
    const kind = hour === 13 ? 'nudge-13' : hour === 20 ? 'nudge-20' : null;
    if (!kind) continue;
    const { data: st } = await admin.rpc('account_status', { uid: m.id });
    if (!['trial', 'day7', 'subscribed'].includes(st?.status)) continue;      // locked members get no daily nudges
    if (kind === 'nudge-20') {
      const { count } = await admin.from('tales').select('id', { count: 'exact', head: true }).eq('user_id', m.id).eq('tale_date', date);
      if ((count ?? 0) > 0) continue;
    }
    if (!(await firstTime(m.id, kind, date))) continue;
    const { data: subs } = await admin.from('push_subscriptions').select('*').eq('user_id', m.id);
    for (const s of subs ?? []) {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify({ ...COPY[kind], url: '/' }));
        sent++;
      } catch (e) {
        if ([404, 410].includes((e as { statusCode?: number }).statusCode ?? 0)) await admin.from('push_subscriptions').delete().eq('id', s.id); // phone unsubscribed
      }
    }
  }
  return json({ ok: true, sent });
});
