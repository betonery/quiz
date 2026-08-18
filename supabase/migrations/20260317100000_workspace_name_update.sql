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

create policy "Admins can update workspace"
  on public.workspaces for update
  to authenticated
  using (public.is_workspace_admin(id))
  with check (public.is_workspace_admin(id));

create or replace function public.guard_workspace_name_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.id is distinct from new.id
    or old.slug is distinct from new.slug
    or old.owner_id is distinct from new.owner_id
    or old.created_at is distinct from new.created_at
  then
    raise exception 'Only workspace name can be updated';
  end if;

  return new;
end;
$$;

create trigger workspaces_guard_name_update
  before update on public.workspaces
  for each row execute function public.guard_workspace_name_update();
