alter table "public"."invoices"
add column if not exists "description" text,
add column if not exists "items" jsonb default '[]'::jsonb;
