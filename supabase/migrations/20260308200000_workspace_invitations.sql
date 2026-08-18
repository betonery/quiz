create table public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'member')),
  token text not null unique default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  invited_by uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);

create unique index workspace_invitations_pending_email_idx
  on public.workspace_invitations (workspace_id, lower(email))
  where status = 'pending';

create or replace function public.is_workspace_admin(ws_id uuid)
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
      and role in ('owner', 'admin')
  );
$$;

create or replace function public.get_user_workspace_role(ws_id uuid)
returns text
language sql
security definer
set search_path = ''
stable
as $$
  select role
  from public.workspace_members
  where workspace_id = ws_id
    and user_id = auth.uid()
  limit 1;
$$;

create or replace function public.accept_workspace_invitation(invite_token text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  inv public.workspace_invitations%rowtype;
  ws_slug text;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado';
  end if;

  select * into inv
  from public.workspace_invitations
  where token = invite_token
    and status = 'pending'
    and expires_at > now()
  for update;

  if not found then
    raise exception 'Convite inválido ou expirado';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and lower(email) = lower(inv.email)
  ) then
    raise exception 'O e-mail do convite não corresponde à sua conta';
  end if;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (inv.workspace_id, auth.uid(), inv.role)
  on conflict (workspace_id, user_id) do update
    set role = excluded.role;

  update public.workspace_invitations
  set status = 'accepted'
  where id = inv.id;

  select slug into ws_slug
  from public.workspaces
  where id = inv.workspace_id;

  return ws_slug;
end;
$$;

drop policy if exists "Users can view own memberships" on public.workspace_members;

create policy "Members can view workspace roster"
  on public.workspace_members for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

create policy "Workspace members can view teammate profiles"
  on public.profiles for select
  to authenticated
  using (
    exists (
      select 1
      from public.workspace_members wm_self
      join public.workspace_members wm_other
        on wm_self.workspace_id = wm_other.workspace_id
      where wm_self.user_id = auth.uid()
        and wm_other.user_id = profiles.id
    )
  );

alter table public.workspace_invitations enable row level security;

create policy "Admins can view workspace invitations"
  on public.workspace_invitations for select
  to authenticated
  using (public.is_workspace_admin(workspace_id));

create policy "Invitees can view matching pending invitations"
  on public.workspace_invitations for select
  to authenticated
  using (
    status = 'pending'
    and lower(email) = (
      select lower(email)
      from public.profiles
      where id = auth.uid()
    )
  );

create policy "Admins can create invitations"
  on public.workspace_invitations for insert
  to authenticated
  with check (public.is_workspace_admin(workspace_id));

create policy "Admins can update invitations"
  on public.workspace_invitations for update
  to authenticated
  using (public.is_workspace_admin(workspace_id));
