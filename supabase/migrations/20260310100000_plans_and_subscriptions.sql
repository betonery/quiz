create table public.plans (
  id text primary key,
  name text not null,
  description text,
  limits jsonb not null,
  price_cents integer,
  stripe_price_id text,
  is_active boolean not null default true,
  sort_order integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references public.workspaces(id) on delete cascade,
  plan_id text not null references public.plans(id),
  status text not null default 'inactive'
    check (status in ('inactive', 'active', 'past_due', 'canceled')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger plans_updated_at
  before update on public.plans
  for each row execute function public.set_updated_at();

create trigger workspace_subscriptions_updated_at
  before update on public.workspace_subscriptions
  for each row execute function public.set_updated_at();

create index workspace_subscriptions_workspace_id_idx
  on public.workspace_subscriptions (workspace_id);

create index workspace_subscriptions_status_idx
  on public.workspace_subscriptions (status);

insert into public.plans (id, name, description, limits, price_cents, sort_order)
values
  (
    'starter',
    'Starter',
    'Ideal para começar com funis interativos.',
    '{"max_quizzes": 10, "max_team_members": 3, "max_custom_domains": 1}'::jsonb,
    9900,
    1
  ),
  (
    'pro',
    'Pro',
    'Para equipes que precisam escalar funis e domínios.',
    '{"max_quizzes": 50, "max_team_members": 10, "max_custom_domains": -1}'::jsonb,
    29900,
    2
  );

alter table public.plans enable row level security;
alter table public.workspace_subscriptions enable row level security;

create policy "Authenticated users can view active plans"
  on public.plans for select
  to authenticated
  using (is_active = true);

create policy "Members can view workspace subscriptions"
  on public.workspace_subscriptions for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

create policy "Admins can manage workspace subscriptions"
  on public.workspace_subscriptions for insert
  to authenticated
  with check (public.is_workspace_admin(workspace_id));

create policy "Admins can update workspace subscriptions"
  on public.workspace_subscriptions for update
  to authenticated
  using (public.is_workspace_admin(workspace_id))
  with check (public.is_workspace_admin(workspace_id));

create policy "Admins can delete workspace subscriptions"
  on public.workspace_subscriptions for delete
  to authenticated
  using (public.is_workspace_admin(workspace_id));
