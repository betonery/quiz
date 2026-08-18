create table public.quiz_folders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  created_by uuid not null references public.profiles(id),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, name)
);

create index quiz_folders_workspace_idx on public.quiz_folders (workspace_id, sort_order);

create trigger quiz_folders_updated_at
  before update on public.quiz_folders
  for each row execute function public.set_updated_at();

alter table public.quiz_folders enable row level security;

create policy "Members can view quiz folders"
  on public.quiz_folders for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

create policy "Members can create quiz folders"
  on public.quiz_folders for insert
  to authenticated
  with check (
    public.is_workspace_member(workspace_id)
    and created_by = auth.uid()
  );

create policy "Members can update quiz folders"
  on public.quiz_folders for update
  to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "Members can delete quiz folders"
  on public.quiz_folders for delete
  to authenticated
  using (public.is_workspace_member(workspace_id));

alter table public.quizzes
  add column folder_id uuid references public.quiz_folders(id) on delete set null;

create index quizzes_folder_id_idx on public.quizzes (folder_id)
  where folder_id is not null;
