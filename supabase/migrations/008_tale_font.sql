-- How a tale's line looks on the page: '' (classic) or 'hand' (handwriting). Run once in the Supabase SQL editor.
alter table public.tales add column if not exists font text not null default '' check (font in ('', 'hand'));
