alter table public.quizzes
  add column if not exists settings jsonb not null default '{}'::jsonb;

create table public.quiz_custom_domains (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  hostname text not null,
  status text not null default 'pending'
    check (status in ('pending', 'verified', 'failed', 'removed')),
  vercel_domain_id text,
  verification_records jsonb not null default '[]'::jsonb,
  is_primary boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (hostname)
);

create unique index quiz_custom_domains_one_active_per_quiz_idx
  on public.quiz_custom_domains (quiz_id)
  where status != 'removed';

create index quiz_custom_domains_hostname_verified_idx
  on public.quiz_custom_domains (hostname)
  where status = 'verified';

create index quiz_custom_domains_quiz_id_idx
  on public.quiz_custom_domains (quiz_id);

create trigger quiz_custom_domains_updated_at
  before update on public.quiz_custom_domains
  for each row execute function public.set_updated_at();

alter table public.quiz_custom_domains enable row level security;

create policy "Members can view quiz custom domains"
  on public.quiz_custom_domains for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

create policy "Members can create quiz custom domains"
  on public.quiz_custom_domains for insert
  to authenticated
  with check (public.is_workspace_member(workspace_id));

create policy "Members can update quiz custom domains"
  on public.quiz_custom_domains for update
  to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "Members can delete quiz custom domains"
  on public.quiz_custom_domains for delete
  to authenticated
  using (public.is_workspace_member(workspace_id));
