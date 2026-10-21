// "Speak instead of typing": the app records a few seconds of speech and sends it here; the words come back as text.
// The audio is sent to OpenAI's speech-to-text service, is not stored by us, and is never used for anything else.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { json } from '../_shared/common.ts';

const MAX_BYTES = 3 * 1024 * 1024;     // about 90 seconds of speech

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return json({});
  const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return json({ error: 'sign in first' }, 401);
  const key = Deno.env.get('OPENAI_API_KEY');
  if (!key) return json({ error: 'Speaking is opening soon.', code: 'not_configured' }, 503);

  const form = await req.formData().catch(() => null);
  const file = form?.get('audio');
  if (!(file instanceof File) || !file.size) return json({ error: 'no audio' }, 400);
  if (file.size > MAX_BYTES) return json({ error: 'That was too long. Try a shorter sentence.' }, 413);

  const out = new FormData();
  out.append('file', file, file.name || 'speech.webm');
  out.append('model', Deno.env.get('TRANSCRIBE_MODEL') ?? 'gpt-4o-mini-transcribe');
  out.append('response_format', 'json');
  const r = await fetch('https://api.openai.com/v1/audio/transcriptions', { method: 'POST', headers: { Authorization: `Bearer ${key}` }, body: out });
  const res = await r.json().catch(() => ({}));
  if (!r.ok) return json({ error: 'We couldn’t turn that into words. Please try again.' }, 502);
  return json({ text: String(res.text ?? '').trim() });
});
