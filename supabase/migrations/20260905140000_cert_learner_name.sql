-- Trust Engine WP 2.5 — certificates carry the learner's printed name.
alter table public.certificates add column if not exists learner_name text;

notify pgrst, 'reload schema';
