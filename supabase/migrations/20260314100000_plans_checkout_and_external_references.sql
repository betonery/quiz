alter table public.plans
  add column if not exists checkout_url text,
  add column if not exists external_references text[] not null default '{}';
