-- Dalqen prototype only. Run once in the Supabase SQL editor.
-- This intentionally exposes one fictional demo row to anonymous readers and writers.

create table if not exists public.prototype_demo_state (
  id text primary key check (id = 'global'),
  state jsonb not null,
  updated_at timestamptz not null default now(),
  constraint prototype_demo_state_shape check (
    jsonb_typeof(state) = 'object'
    and state ? 'stage'
    and state ? 'qcStatus'
    and state ? 'notice'
    and state->>'stage' in (
      'Layout', 'Approval', 'Working Doc', 'Sizing', 'Printing',
      'Heatpress', 'Sewing', 'QC', 'For Release', 'Completed'
    )
    and state->>'qcStatus' in ('Pending', 'Passed', 'Issue')
    and length(state->>'notice') <= 500
    and pg_column_size(state) <= 8192
  )
);

insert into public.prototype_demo_state (id, state)
values (
  'global',
  '{"stage":"Sewing","qcStatus":"Pending","notice":""}'::jsonb
)
on conflict (id) do nothing;

alter table public.prototype_demo_state enable row level security;

revoke all on table public.prototype_demo_state from anon, authenticated;
grant select, update on table public.prototype_demo_state to anon, authenticated;

drop policy if exists "Public prototype can read global demo" on public.prototype_demo_state;
create policy "Public prototype can read global demo"
on public.prototype_demo_state
for select
to anon, authenticated
using (id = 'global');

drop policy if exists "Public prototype can update global demo" on public.prototype_demo_state;
create policy "Public prototype can update global demo"
on public.prototype_demo_state
for update
to anon, authenticated
using (id = 'global')
with check (id = 'global');

-- Realtime lets open browsers receive workflow changes without refreshing.
do $$
begin
  alter publication supabase_realtime add table public.prototype_demo_state;
exception
  when duplicate_object then null;
end $$;
