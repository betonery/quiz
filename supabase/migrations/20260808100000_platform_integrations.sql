-- Integrações de webhook com plataformas de venda externas.
--
-- Cada integração expõe uma URL (Edge Function `webhook-in` + token). A
-- plataforma posta os eventos ali; o sistema captura o payload, o admin mapeia
-- os campos no painel e ativa. A partir daí uma compra cria/atualiza a conta e
-- libera o plano; um reembolso retira o acesso.
--
-- Escrita e leitura acontecem só via service role (Edge Function e painel).

-- ---------------------------------------------------------------------------
-- 1) Integrações
-- ---------------------------------------------------------------------------

create table if not exists public.platform_integrations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null check (kind in ('purchase', 'refund')),
  -- Identifica a PLATAFORMA, não a integração: vira `workspace_payments.provider`.
  -- A integração de compra e a de reembolso da mesma plataforma compartilham
  -- este valor — é por ele que o reembolso reencontra o pagamento original.
  provider_slug text not null
    check (provider_slug ~ '^[a-z][a-z0-9_-]*$' and length(provider_slug) <= 40),
  -- Mesmo padrão de workspace_invitations: 64 chars hex gerados no banco.
  token text not null unique
    default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  enabled boolean not null default false,
  field_mapping jsonb not null default '{}'::jsonb,
  -- Senha das contas criadas por esta integração (kind = 'purchase').
  default_password text,
  -- Verificação opcional de assinatura da plataforma (hottok, signature, ...).
  signature_secret text,
  signature_location jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists platform_integrations_updated_at on public.platform_integrations;
create trigger platform_integrations_updated_at
  before update on public.platform_integrations
  for each row execute function public.set_updated_at();

comment on column public.platform_integrations.token is
  'Segredo da URL do webhook. Nunca logar a URL completa.';
comment on column public.platform_integrations.default_password is
  'Senha fixa das contas criadas. Legível apenas por platform_role = admin.';
comment on column public.platform_integrations.provider_slug is
  'Grava em workspace_payments.provider. Compra e reembolso da mesma plataforma usam o mesmo valor.';

create index if not exists platform_integrations_provider_idx
  on public.platform_integrations (provider_slug, kind);

-- ---------------------------------------------------------------------------
-- 2) Eventos recebidos
-- ---------------------------------------------------------------------------
-- Guarda TODO evento que chega, inclusive com a integração desativada ou sem
-- mapeamento — é assim que o evento de teste vira a base do mapeamento.

create table if not exists public.platform_integration_events (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid not null
    references public.platform_integrations(id) on delete cascade,
  -- Chave de idempotência: o id do pedido na plataforma, ou o hash do payload.
  event_key text,
  payload jsonb not null,
  status text not null default 'captured'
    check (status in ('captured', 'processed', 'ignored', 'failed')),
  outcome text,
  error_message text,
  -- Saída de integration_apply_mapping, para o admin depurar o mapeamento.
  resolved jsonb,
  workspace_id uuid references public.workspaces(id) on delete set null,
  source_ip text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create unique index if not exists platform_integration_events_key_idx
  on public.platform_integration_events (integration_id, event_key)
  where event_key is not null;

create index if not exists platform_integration_events_recent_idx
  on public.platform_integration_events (integration_id, created_at desc);

-- Suporta o badge de falhas na listagem sem varrer a tabela toda.
create index if not exists platform_integration_events_failed_idx
  on public.platform_integration_events (integration_id)
  where status = 'failed';

comment on column public.platform_integration_events.event_key is
  'Idempotência. Colisão não é veredito: evento não-processado é retomado.';

-- ---------------------------------------------------------------------------
-- 3) Índice de e-mail em profiles
-- ---------------------------------------------------------------------------
-- A ingestão resolve o comprador por e-mail; sem isto é seq scan por webhook.

create index if not exists profiles_email_lower_idx
  on public.profiles (lower(email));

-- ---------------------------------------------------------------------------
-- 4) RLS
-- ---------------------------------------------------------------------------
-- Sem policy alguma, igual a platform_audit_logs: nenhuma sessão de usuário
-- lê estas tabelas. O painel e a Edge Function usam service role, que ignora
-- RLS. Isso também mantém `default_password` fora do alcance de qualquer
-- consulta feita com a chave anon/authenticated.

alter table public.platform_integrations enable row level security;
alter table public.platform_integration_events enable row level security;

-- ---------------------------------------------------------------------------
-- 5) Retenção
-- ---------------------------------------------------------------------------
-- Os payloads carregam dados pessoais do comprador (nome, e-mail, CPF,
-- telefone, endereço). Guardar indefinidamente é problema de LGPD, não só de
-- disco. 90 dias cobre depuração e conciliação.

create or replace function public.purge_old_integration_events()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted integer;
begin
  delete from public.platform_integration_events
  where created_at < now() - interval '90 days';

  get diagnostics v_deleted = row_count;

  return jsonb_build_object(
    'ok', true,
    'deleted_count', v_deleted,
    'ran_at', now()
  );
end;
$$;

revoke all on function public.purge_old_integration_events() from anon, authenticated, public;
grant execute on function public.purge_old_integration_events() to service_role;

-- pg_cron já está habilitado por 20260312100000_expire_overdue_subscriptions.sql.
select cron.unschedule('purge-integration-events-daily')
where exists (
  select 1 from cron.job where jobname = 'purge-integration-events-daily'
);

select cron.schedule(
  'purge-integration-events-daily',
  '30 6 * * *',
  $$ select public.purge_old_integration_events(); $$
);
