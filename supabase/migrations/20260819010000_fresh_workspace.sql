-- Replace the original seeded workflow state with a true first-time workspace.

alter table public.prototype_demo_state
  drop constraint if exists prototype_demo_state_shape;

update public.prototype_demo_state
set state = '{"version":2,"orders":[],"notice":""}'::jsonb,
    updated_at = now()
where id = 'global';

alter table public.prototype_demo_state
  add constraint prototype_demo_state_shape check (
    jsonb_typeof(state) = 'object'
    and state->>'version' = '2'
    and state ? 'orders'
    and jsonb_typeof(state->'orders') = 'array'
    and state ? 'notice'
    and jsonb_typeof(state->'notice') = 'string'
    and length(state->>'notice') <= 500
    and pg_column_size(state) <= 524288
  );
