// "Speak instead of typing": record a few seconds with the microphone, the server turns it into words (supabase/functions/transcribe).
import { client } from './auth.js';

export async function transcribe(blob) {
  const c = await client();
  const ext = /mp4|aac|m4a/i.test(blob.type) ? 'm4a' : /ogg/i.test(blob.type) ? 'ogg' : /wav/i.test(blob.type) ? 'wav' : 'webm';
  const fd = new FormData(); fd.append('audio', blob, `speech.${ext}`);
  const { data, error } = await c.functions.invoke('transcribe', { body: fd });
  let body = data;
  if (error && error.context?.json) body = await error.context.json().catch(() => null);
  if (body?.code === 'not_configured') { const e = new Error('not_configured'); e.code = 'not_configured'; throw e; }
  if (error || typeof body?.text !== 'string') throw new Error(body?.error || 'We couldn’t turn that into words. Please try again.');
  return body.text;
}
