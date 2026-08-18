-- Painel administrativo da plataforma.
--
-- Introduz um papel GLOBAL (`profiles.platform_role`), distinto do papel por
-- workspace (`workspace_members.role`). Só `admin` pode escrever; `support`
-- enxerga tudo sem alterar nada.
--
-- O painel lê e escreve via service role (bypassa RLS) sempre atrás do guard
-- em `src/domains/admin/services/admin-guard.service.ts`. As policies abaixo
-- existem como defesa em profundidade — se algo consultar com a sessão do
-- usuário, o staff continua enxergando o que precisa e mais ninguém.

-- ---------------------------------------------------------------------------
-- 1) Papel de plataforma
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists platform_role text not null default 'user'
    check (platform_role in ('user', 'support', 'admin')),
  add column if not exists suspended_at timestamptz,
  add column if not exists suspended_reason text,
  add column if not exists internal_notes text;

create index if not exists profiles_platform_role_idx
  on public.profiles (platform_role)
  where platform_role <> 'user';

create index if not exists profiles_created_at_idx
  on public.profiles (created_at desc);

comment on column public.profiles.platform_role is
  'Papel global na plataforma: user | support | admin. Distinto de workspace_members.role.';
comment on column public.profiles.suspended_at is
  'Espelha o ban em auth.users para exibição no painel. A suspensão real é o ban_duration do Auth.';

-- ---------------------------------------------------------------------------
-- 2) Helpers de autorização
-- ---------------------------------------------------------------------------

-- security definer: lê `profiles` ignorando RLS, o que evita recursão quando a
-- própria policy de `profiles` chama estas funções.
create or replace function public.is_platform_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.platform_role = 'admin'
  );
$$;

create or replace function public.is_platform_staff()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.platform_role in ('admin', 'support')
  );
$$;

-- ---------------------------------------------------------------------------
-- 3) Trava de escalação de privilégio
-- ---------------------------------------------------------------------------
-- `profiles` já permite "Users can update own profile". Sem esta trava,
-- qualquer usuário poderia se promover a admin com um único update.
-- Só service_role (o painel) e postgres (migrations/psql) mexem nestes campos.

create or replace function public.guard_platform_role_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if current_setting('role', true) in ('service_role', 'postgres')
     or current_user in ('service_role', 'postgres', 'supabase_admin')
  then
    return new;
  end if;

  if new.platform_role is distinct from old.platform_role then
    raise exception 'platform_role só pode ser alterado pelo painel administrativo';
  end if;

  if new.suspended_at is distinct from old.suspended_at
     or new.suspended_reason is distinct from old.suspended_reason
     or new.internal_notes is distinct from old.internal_notes
  then
    raise exception 'campos administrativos são somente leitura para o usuário';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard_platform_role on public.profiles;
create trigger profiles_guard_platform_role
  before update on public.profiles
  for each row execute function public.guard_platform_role_update();

-- ---------------------------------------------------------------------------
-- 4) Configurações globais (linha única)
-- ---------------------------------------------------------------------------

create table if not exists public.platform_settings (
  id smallint primary key default 1 check (id = 1),
  maintenance_mode boolean not null default false,
  maintenance_message text not null default 'Estamos em manutenção. Voltamos em instantes.',
  signups_enabled boolean not null default true,
  signups_disabled_message text not null default 'Novos cadastros estão temporariamente desativados.',
  global_announcement text,
  default_plan_id text references public.plans(id) on delete set null,
  trial_days integer not null default 0 check (trial_days >= 0 and trial_days <= 365),
  support_email text,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.platform_settings (id) values (1)
  on conflict (id) do nothing;

drop trigger if exists platform_settings_updated_at on public.platform_settings;
create trigger platform_settings_updated_at
  before update on public.platform_settings
  for each row execute function public.set_updated_at();

alter table public.platform_settings enable row level security;

-- Leitura pelo staff no painel. O app público lê via service role.
drop policy if exists "Platform staff can view settings" on public.platform_settings;
create policy "Platform staff can view settings"
  on public.platform_settings for select
  to authenticated
  using (public.is_platform_staff());

-- ---------------------------------------------------------------------------
-- 5) Trilha de auditoria
-- ---------------------------------------------------------------------------

create table if not exists public.platform_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  actor_email text not null,
  action text not null,
  entity_type text not null,
  entity_id text,
  entity_label text,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists platform_audit_logs_created_at_idx
  on public.platform_audit_logs (created_at desc);

create index if not exists platform_audit_logs_actor_idx
  on public.platform_audit_logs (actor_id, created_at desc);

create index if not exists platform_audit_logs_entity_idx
  on public.platform_audit_logs (entity_type, entity_id, created_at desc);

alter table public.platform_audit_logs enable row level security;

drop policy if exists "Platform staff can view audit logs" on public.platform_audit_logs;
create policy "Platform staff can view audit logs"
  on public.platform_audit_logs for select
  to authenticated
  using (public.is_platform_staff());

-- Sem policy de INSERT/UPDATE/DELETE: a trilha só é escrita via service role e
-- é imutável para qualquer sessão de usuário, inclusive a de um admin.

-- ---------------------------------------------------------------------------
-- 6) Visibilidade global para o staff (defesa em profundidade)
-- ---------------------------------------------------------------------------

drop policy if exists "Platform staff can view all profiles" on public.profiles;
create policy "Platform staff can view all profiles"
  on public.profiles for select
  to authenticated
  using (public.is_platform_staff());

drop policy if exists "Platform staff can view all workspaces" on public.workspaces;
create policy "Platform staff can view all workspaces"
  on public.workspaces for select
  to authenticated
  using (public.is_platform_staff());

drop policy if exists "Platform staff can view all workspace members" on public.workspace_members;
create policy "Platform staff can view all workspace members"
  on public.workspace_members for select
  to authenticated
  using (public.is_platform_staff());

drop policy if exists "Platform staff can view all quizzes" on public.quizzes;
create policy "Platform staff can view all quizzes"
  on public.quizzes for select
  to authenticated
  using (public.is_platform_staff());

drop policy if exists "Platform staff can view all subscriptions" on public.workspace_subscriptions;
create policy "Platform staff can view all subscriptions"
  on public.workspace_subscriptions for select
  to authenticated
  using (public.is_platform_staff());

drop policy if exists "Platform staff can view all payments" on public.workspace_payments;
create policy "Platform staff can view all payments"
  on public.workspace_payments for select
  to authenticated
  using (public.is_platform_staff());

drop policy if exists "Platform staff can view all plans" on public.plans;
create policy "Platform staff can view all plans"
  on public.plans for select
  to authenticated
  using (public.is_platform_staff());

drop policy if exists "Platform admins can manage plans" on public.plans;
create policy "Platform admins can manage plans"
  on public.plans for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

drop policy if exists "Platform admins can manage subscriptions" on public.workspace_subscriptions;
create policy "Platform admins can manage subscriptions"
  on public.workspace_subscriptions for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- 7) Plano padrão e período de teste no cadastro
-- ---------------------------------------------------------------------------
-- O workspace nasce dentro de `handle_new_user`; a assinatura de teste precisa
-- nascer na mesma transação, senão o usuário cai no dashboard sem plano.
-- Quando `default_plan_id` está vazio ou `trial_days` = 0, nada é criado e o
-- comportamento atual (workspace sem assinatura) se mantém.

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
  v_default_plan_id text;
  v_trial_days integer;
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

  select ps.default_plan_id, ps.trial_days
    into v_default_plan_id, v_trial_days
  from public.platform_settings ps
  where ps.id = 1;

  if v_default_plan_id is not null and coalesce(v_trial_days, 0) > 0 then
    insert into public.workspace_subscriptions (
      workspace_id,
      plan_id,
      status,
      current_period_start,
      current_period_end
    )
    values (
      new_workspace_id,
      v_default_plan_id,
      'active',
      now(),
      now() + make_interval(days => v_trial_days)
    )
    on conflict (workspace_id) do nothing;
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 8) Least privilege
-- ---------------------------------------------------------------------------

revoke all on function public.guard_platform_role_update() from anon, authenticated, public;
revoke all on function public.handle_new_user() from anon, authenticated, public;
revoke execute on function public.is_platform_admin() from anon;
revoke execute on function public.is_platform_staff() from anon;
grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.is_platform_staff() to authenticated;

-- ---------------------------------------------------------------------------
-- 9) Primeiro administrador
-- ---------------------------------------------------------------------------
-- O painel bloqueia a remoção do último admin, mas o primeiro precisa nascer
-- aqui. Troque o e-mail e rode uma única vez (via SQL Editor do Supabase ou
-- `psql`, onde o guard do item 3 não se aplica):
--
--   update public.profiles set platform_role = 'admin'
--   where email = 'seu-email@dominio.com';
