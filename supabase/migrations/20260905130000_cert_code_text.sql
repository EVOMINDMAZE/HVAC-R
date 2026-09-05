-- Trust Engine Stage 2 fix — certificates.code must hold human-typable codes
-- (VC-EPA6-XXXXXXXX), not uuids. Employers type these at /verify.
alter table public.certificates alter column code drop default;
alter table public.certificates alter column code type text using code::text;

notify pgrst, 'reload schema';
