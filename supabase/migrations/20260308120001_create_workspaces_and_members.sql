create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create trigger workspaces_updated_at
  before update on public.workspaces
  for each row execute function public.set_updated_at();

create or replace function public.is_workspace_member(ws_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = ws_id
      and user_id = auth.uid()
  );
$$;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;

create policy "Members can view workspaces"
  on public.workspaces for select
  to authenticated
  using (public.is_workspace_member(id));

create policy "Users can view own memberships"
  on public.workspace_members for select
  to authenticated
  using (user_id = auth.uid());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  workspace_name text;
  workspace_slug text;
  new_workspace_id uuid;
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );

  workspace_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    'Meu workspace'
  );

  workspace_slug := 'workspace-' || substr(replace(new.id::text, '-', ''), 1, 8);

  insert into public.workspaces (name, slug, owner_id)
  values (workspace_name, workspace_slug, new.id)
  returning id into new_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (new_workspace_id, new.id, 'owner');

  return new;
end;
$$;
