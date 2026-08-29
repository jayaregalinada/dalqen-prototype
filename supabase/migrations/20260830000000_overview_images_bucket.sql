-- Overview images: private bucket, images referenced by canonical path in the demo state,
-- rendered via short-lived signed URLs. Anon role may upload and sign (prototype scope).
insert into storage.buckets (id, name, public)
values ('overview-images', 'overview-images', false)
on conflict (id) do update set public = false;

create policy "anon uploads overview images"
  on storage.objects for insert to anon
  with check (bucket_id = 'overview-images');

create policy "anon reads/signs overview images"
  on storage.objects for select to anon
  using (bucket_id = 'overview-images');
