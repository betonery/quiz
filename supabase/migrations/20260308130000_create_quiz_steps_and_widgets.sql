create table public.quiz_steps (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  position integer not null,
  settings jsonb not null default '{"showLogo": true, "showProgress": true, "allowBack": true}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (quiz_id, position)
);

create table public.quiz_widgets (
  id uuid primary key default gen_random_uuid(),
  step_id uuid not null references public.quiz_steps(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  type text not null check (type in ('text', 'button')),
  position integer not null,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (step_id, position)
);

create index quiz_steps_quiz_id_idx on public.quiz_steps (quiz_id);
create index quiz_steps_workspace_id_idx on public.quiz_steps (workspace_id);
create index quiz_widgets_step_id_idx on public.quiz_widgets (step_id);
create index quiz_widgets_workspace_id_idx on public.quiz_widgets (workspace_id);

create trigger quiz_steps_updated_at
  before update on public.quiz_steps
  for each row execute function public.set_updated_at();

create trigger quiz_widgets_updated_at
  before update on public.quiz_widgets
  for each row execute function public.set_updated_at();

create or replace function public.set_quiz_step_workspace_id()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  select q.workspace_id into new.workspace_id
  from public.quizzes q
  where q.id = new.quiz_id;
  return new;
end;
$$;

create or replace function public.set_quiz_widget_workspace_id()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  select s.workspace_id into new.workspace_id
  from public.quiz_steps s
  where s.id = new.step_id;
  return new;
end;
$$;

create trigger quiz_steps_set_workspace_id
  before insert on public.quiz_steps
  for each row execute function public.set_quiz_step_workspace_id();

create trigger quiz_widgets_set_workspace_id
  before insert on public.quiz_widgets
  for each row execute function public.set_quiz_widget_workspace_id();

alter table public.quiz_steps enable row level security;
alter table public.quiz_widgets enable row level security;

create policy "Members can view quiz steps"
  on public.quiz_steps for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

create policy "Members can create quiz steps"
  on public.quiz_steps for insert
  to authenticated
  with check (public.is_workspace_member(workspace_id));

create policy "Members can update quiz steps"
  on public.quiz_steps for update
  to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "Members can delete quiz steps"
  on public.quiz_steps for delete
  to authenticated
  using (public.is_workspace_member(workspace_id));

create policy "Members can view quiz widgets"
  on public.quiz_widgets for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

create policy "Members can create quiz widgets"
  on public.quiz_widgets for insert
  to authenticated
  with check (public.is_workspace_member(workspace_id));

create policy "Members can update quiz widgets"
  on public.quiz_widgets for update
  to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "Members can delete quiz widgets"
  on public.quiz_widgets for delete
  to authenticated
  using (public.is_workspace_member(workspace_id));
