create table public.quiz_share_links (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null unique references public.quizzes (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  share_token text not null unique,
  enabled boolean not null default false,
  snapshot jsonb not null,
  schema_version integer not null default 1,
  source_title text not null,
  import_count integer not null default 0 check (import_count >= 0),
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index quiz_share_links_token_idx
  on public.quiz_share_links (share_token)
  where enabled = true;

create trigger quiz_share_links_updated_at
  before update on public.quiz_share_links
  for each row execute function public.set_updated_at();

alter table public.quiz_share_links enable row level security;

create policy "Members can view quiz share links"
  on public.quiz_share_links for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

create policy "Members can create quiz share links"
  on public.quiz_share_links for insert
  to authenticated
  with check (public.is_workspace_member(workspace_id));

create policy "Members can update quiz share links"
  on public.quiz_share_links for update
  to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "Members can delete quiz share links"
  on public.quiz_share_links for delete
  to authenticated
  using (public.is_workspace_member(workspace_id));
