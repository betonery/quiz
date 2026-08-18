alter table public.workspace_subscriptions
  add column if not exists external_subscription_id text;

create table public.workspace_payments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  plan_id text not null references public.plans(id),
  external_payment_id text not null,
  provider text not null default 'external',
  amount_cents integer not null check (amount_cents > 0),
  payment_method text not null,
  period_start timestamptz not null,
  period_end timestamptz not null,
  status text not null default 'paid'
    check (status in ('paid', 'failed', 'refunded')),
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  unique (provider, external_payment_id)
);

create index workspace_payments_workspace_id_created_at_idx
  on public.workspace_payments (workspace_id, created_at desc);

alter table public.workspace_payments enable row level security;

create policy "Members can view workspace payments"
  on public.workspace_payments for select
  to authenticated
  using (public.is_workspace_member(workspace_id));
