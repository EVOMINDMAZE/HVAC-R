-- Trust Engine WP 2.5 backfill — certificates issued before learner_name
-- existed get a neutral holder name so no live verify page shows a generic
-- fallback.
update public.certificates set learner_name = 'Demo Learner' where learner_name is null;

notify pgrst, 'reload schema';
