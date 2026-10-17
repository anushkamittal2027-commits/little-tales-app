-- Lets a tale keep its photo raw ("Original", no light effect).
alter table public.tales drop constraint if exists tales_light_check;
alter table public.tales add constraint tales_light_check check (light in ('morning','golden','dark','none'));
