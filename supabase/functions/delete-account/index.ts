// "Delete my account and tales": removes every file and row, then the sign-in itself. Always available, even when locked.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { admin, json, removeAllFiles } from '../_shared/common.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return json({});
  const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return json({ error: 'sign in first' }, 401);
  for (const bucket of ['photos', 'voices', 'videos']) await removeAllFiles(bucket, user.id);
  const { error } = await admin.auth.admin.deleteUser(user.id); // cascades to profile, tales, subscription, reminders
  return error ? json({ error: error.message }, 500) : json({ ok: true });
});
