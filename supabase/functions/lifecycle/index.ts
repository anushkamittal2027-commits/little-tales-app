// Runs once a day. Warns locked members with 7 days and 1 day left, and permanently deletes tales after 30 days locked.
import { admin, isScheduler, json, localParts, firstTime, sendEmail } from '../_shared/common.ts';

async function wipe(userId: string) {
  for (const bucket of ['photos', 'voices', 'videos']) {
    const { data: files } = await admin.storage.from(bucket).list(userId, { limit: 1000 });
    if (files?.length) await admin.storage.from(bucket).remove(files.map((f) => `${userId}/${f.name}`));
  }
  await admin.from('week_videos').delete().eq('user_id', userId);
  await admin.from('tales').delete().eq('user_id', userId);
}

const warning = (left: number) => ({
  subject: left === 1 ? 'Last day to keep your Little Tales' : `${left} days left to keep your Little Tales`,
  html: `<p>Your calendar is locked, but your tales are safe for <b>${left} more ${left === 1 ? 'day' : 'days'}</b>.</p>
         <p>Subscribe in that time and everything comes back exactly as it was. After that, your tales are permanently deleted.</p>
         <p>Your camera roll forgets. Your album won't.</p>`,
});

Deno.serve(async (req) => {
  if (!isScheduler(req)) return json({ error: 'not allowed' }, 401);
  const { data: members } = await admin.from('profiles').select('id, email, tz, notify_email');
  const out = { warned: 0, deleted: 0 };
  for (const m of members ?? []) {
    const { data: st } = await admin.rpc('account_status', { uid: m.id });
    if (st?.status === 'deleted') { await wipe(m.id); out.deleted++; continue; }
    if (st?.status !== 'locked' || !m.email || !m.notify_email) continue;
    const left = st.hold_left as number;
    if (left !== 7 && left !== 1) continue;
    const { date } = localParts(m.tz);
    if (!(await firstTime(m.id, `hold-${left}`, date))) continue;
    const w = warning(left);
    if (await sendEmail(m.email, w.subject, w.html)) out.warned++;
  }
  return json({ ok: true, ...out });
});
