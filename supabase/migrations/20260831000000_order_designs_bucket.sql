-- Designs for Approval gate: private bucket, paths stored as "order-designs/<uuid>.ext"
-- and rendered via signed URLs like overview-images.
insert into storage.buckets (id, name, public)
values ('order-designs', 'order-designs', false)
on conflict (id) do update set public = false;

create policy "anon uploads order designs"
  on storage.objects for insert to anon
  with check (bucket_id = 'order-designs');

create policy "anon reads/signs order designs"
  on storage.objects for select to anon
  using (bucket_id = 'order-designs');
