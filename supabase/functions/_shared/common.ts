// Shared helpers for the Little Tales server jobs. (Supabase Edge Functions run on Deno.)
import { createClient } from 'npm:@supabase/supabase-js@2';

export const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

// Only the scheduler (holding the service key) may call the job functions.
export const isScheduler = (req: Request) => req.headers.get('Authorization') === `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`;

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' } });

// A member's local date (YYYY-MM-DD) and hour, from their own time zone.
export function localParts(tz: string, at = new Date()) {
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(at);
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', hour12: false }).format(at));
  return { date, hour };
}

// Has this message already gone out today? Records it if not.
export async function firstTime(userId: string, kind: string, day: string) {
  const { error } = await admin.from('notification_log').insert({ user_id: userId, kind, day });
  return !error; // a duplicate key means it was already sent
}

export async function sendEmail(to: string, subject: string, html: string) {
  const key = Deno.env.get('RESEND_API_KEY');
  if (!key) return false;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: Deno.env.get('MAIL_FROM') ?? 'Little Tales <hello@littletales.me>', to, subject, html }),
  });
  return r.ok;
}

// Remove every file a member has in one storage bucket, however many there are (the list call returns at most 1000 at a time).
export async function removeAllFiles(bucket: string, userId: string) {
  for (let round = 0; round < 100; round++) {
    const { data: files } = await admin.storage.from(bucket).list(userId, { limit: 1000 });
    if (!files?.length) return;
    await admin.storage.from(bucket).remove(files.map((f: { name: string }) => `${userId}/${f.name}`));
    if (files.length < 1000) return;
  }
}
