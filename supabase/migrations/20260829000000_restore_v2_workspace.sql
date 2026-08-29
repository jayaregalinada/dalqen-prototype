-- Restore this prototype (v2 state shape) as the owner of the global row.
-- A newer prototype iteration (version 3: depts/routes/customers/activity) pushed a
-- remote-only migration on 2026-08-26 that repointed the shape constraint and data.
-- This migration re-seeds the v2 workspace and re-declares the matching constraint.

-- Drop whatever shape constraints previous prototypes left on the state column.
do $$
declare r record;
begin
  for r in
    select conname from pg_constraint
    where conrelid = 'public.prototype_demo_state'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%state%'
  loop
    execute format('alter table public.prototype_demo_state drop constraint if exists %I', r.conname);
  end loop;
end $$;

update public.prototype_demo_state
set state = '{
  "version": 2,
  "orders": [],
  "notice": "",
  "categories": ["Apparel", "Print", "Tarpaulin", "Custom"],
  "orderTypes": {
    "Apparel": ["Jersey Set", "Jersey Upper", "Polo", "T-shirt"],
    "Print": ["Print Only / DTF", "Print & Press", "Silkscreen", "Sublimation"],
    "Tarpaulin": ["Tarpaulin"],
    "Custom": ["Custom item"]
  }
}'::jsonb,
    updated_at = now()
where id = 'global';

-- Same v2 contract as 20260819010000, with two relaxations:
-- - categories/orderTypes now live inside the state (user-extendable dropdowns)
-- - size cap raised from 512KB to 8MB: the overview editor stores pasted images
--   as inline base64 data URLs, which blow past 512KB on the first image.
alter table public.prototype_demo_state
  drop constraint if exists prototype_demo_state_shape;

alter table public.prototype_demo_state
  add constraint prototype_demo_state_shape check (
    jsonb_typeof(state) = 'object'
    and state->>'version' = '2'
    and state ? 'orders'
    and jsonb_typeof(state->'orders') = 'array'
    and state ? 'notice'
    and jsonb_typeof(state->'notice') = 'string'
    and length(state->>'notice') <= 500
    and pg_column_size(state) <= 8388608
  );
