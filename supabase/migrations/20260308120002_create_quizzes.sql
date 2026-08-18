create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  slug text not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, slug)
);

create index quizzes_workspace_id_idx on public.quizzes (workspace_id);
create index quizzes_workspace_updated_idx on public.quizzes (workspace_id, updated_at desc);

create trigger quizzes_updated_at
  before update on public.quizzes
  for each row execute function public.set_updated_at();

alter table public.quizzes enable row level security;

create policy "Members can view quizzes"
  on public.quizzes for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

create policy "Members can create quizzes"
  on public.quizzes for insert
  to authenticated
  with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());

create policy "Members can update quizzes"
  on public.quizzes for update
  to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "Members can delete quizzes"
  on public.quizzes for delete
  to authenticated
  using (public.is_workspace_member(workspace_id));
