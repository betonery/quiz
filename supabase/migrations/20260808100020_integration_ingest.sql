-- Ingestão de eventos das integrações.
--
-- A Edge Function é fina de propósito: só HTTP e criação de usuário (que exige
-- a Admin API do Auth). Toda a decisão vive aqui, para não duplicar em Deno o
-- que já existe em SQL — e para que o preview do painel use o mesmo código.

-- ---------------------------------------------------------------------------
-- 1) Patch em process_payment_webhook
-- ---------------------------------------------------------------------------
-- O branch de duplicata retornava ANTES do upsert da assinatura. Se o pagamento
-- foi gravado mas a assinatura falhou depois, nenhum reenvio consertava — o
-- cliente pagava e ficava sem acesso. Fazer o upsert também no branch duplicado
-- é idempotente e cicatriza esse estado.

create or replace function public.process_payment_webhook(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_workspace_id uuid;
  v_plan_id text;
  v_provider text;
  v_external_payment_id text;
  v_amount_cents integer;
  v_payment_id uuid;
  v_duplicate boolean := false;
begin
  if coalesce(payload->>'event', '') is distinct from 'payment.paid' then
    raise exception 'evento invalido: esperado payment.paid';
  end if;

  v_workspace_id := (payload->>'workspace_id')::uuid;
  v_plan_id := payload->>'plan_id';
  v_provider := nullif(trim(payload->>'provider'), '');
  v_external_payment_id := nullif(trim(payload->>'external_payment_id'), '');
  v_amount_cents := (payload->>'amount_cents')::integer;

  if v_provider is null or v_external_payment_id is null then
    raise exception 'provider e external_payment_id sao obrigatorios';
  end if;

  if v_amount_cents is null or v_amount_cents <= 0 then
    raise exception 'amount_cents invalido';
  end if;

  if coalesce(trim(payload->>'payment_method'), '') = '' then
    raise exception 'payment_method obrigatorio';
  end if;

  if payload->>'period_start' is null or payload->>'period_end' is null then
    raise exception 'period_start e period_end obrigatorios';
  end if;

  if not exists (
    select 1 from public.workspaces w where w.id = v_workspace_id
  ) then
    raise exception 'workspace nao encontrado';
  end if;

  if not exists (
    select 1 from public.plans p where p.id = v_plan_id and p.is_active = true
  ) then
    raise exception 'plano nao encontrado ou inativo';
  end if;

  insert into public.workspace_payments (
    workspace_id, plan_id, external_payment_id, provider, amount_cents,
    payment_method, period_start, period_end, status, raw_payload
  )
  values (
    v_workspace_id, v_plan_id, v_external_payment_id, v_provider, v_amount_cents,
    trim(payload->>'payment_method'),
    (payload->>'period_start')::timestamptz,
    (payload->>'period_end')::timestamptz,
    'paid', payload
  )
  on conflict (provider, external_payment_id) do nothing
  returning id into v_payment_id;

  v_duplicate := v_payment_id is null;

  -- Roda mesmo quando o pagamento é duplicado: é idempotente e garante que a
  -- assinatura reflita a compra ainda que a primeira tentativa tenha falhado
  -- depois de gravar o pagamento.
  insert into public.workspace_subscriptions (
    workspace_id, plan_id, status,
    current_period_start, current_period_end, external_subscription_id
  )
  values (
    v_workspace_id, v_plan_id, 'active',
    (payload->>'period_start')::timestamptz,
    (payload->>'period_end')::timestamptz,
    v_external_payment_id
  )
  on conflict (workspace_id) do update set
    plan_id = excluded.plan_id,
    status = 'active',
    current_period_start = excluded.current_period_start,
    current_period_end = excluded.current_period_end,
    external_subscription_id = excluded.external_subscription_id,
    updated_at = now();

  return jsonb_build_object(
    'ok', true,
    'duplicate', v_duplicate,
    'subscription_updated', true,
    'payment_id', v_payment_id
  );
end;
$$;

revoke all on function public.process_payment_webhook(jsonb) from public, anon, authenticated;
grant execute on function public.process_payment_webhook(jsonb) to service_role;

-- ---------------------------------------------------------------------------
-- 2) Concessão de acesso
-- ---------------------------------------------------------------------------
-- Compartilhada entre "usuário já existia" (resolvido na própria ingestão) e
-- "usuário acabou de ser criado" (chamada de volta pela Edge Function).

create or replace function public.integration_grant_access(
  p_event_id uuid,
  p_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.platform_integration_events%rowtype;
  v_integration public.platform_integrations%rowtype;
  v_resolved jsonb;
  v_workspace_id uuid;
  v_plan_id text;
  v_days integer;
  v_amount bigint;
  v_external_payment_id text;
  v_payment_method text;
  v_current_plan text;
  v_current_end timestamptz;
  v_period_start timestamptz;
  v_period_end timestamptz;
  v_outcome text;
begin
  select * into v_event
  from public.platform_integration_events
  where id = p_event_id;

  if not found then
    return jsonb_build_object('status', 'failed', 'error', 'evento nao encontrado');
  end if;

  select * into v_integration
  from public.platform_integrations
  where id = v_event.integration_id;

  v_resolved := v_event.resolved;
  v_plan_id := v_resolved ->> 'resolvedPlanId';
  v_days := (v_resolved ->> 'days')::integer;
  v_amount := nullif(v_resolved ->> 'amountCents', '')::bigint;
  v_external_payment_id := v_resolved ->> 'externalPaymentId';
  v_payment_method := coalesce(nullif(v_resolved ->> 'paymentMethod', ''), 'externo');

  -- Workspace do comprador: o mais antigo que ele possui (o do cadastro).
  select w.id into v_workspace_id
  from public.workspaces w
  where w.owner_id = p_user_id
  order by w.created_at asc
  limit 1;

  if v_workspace_id is null then
    update public.platform_integration_events
       set status = 'failed',
           error_message = 'Usuário sem workspace próprio',
           processed_at = now()
     where id = p_event_id;
    return jsonb_build_object('status', 'failed', 'error', 'usuario sem workspace');
  end if;

  if v_days is null or v_days <= 0 then
    update public.platform_integration_events
       set status = 'failed',
           error_message = 'Dias de acesso não resolvidos',
           processed_at = now()
     where id = p_event_id;
    return jsonb_build_object('status', 'failed', 'error', 'dias invalidos');
  end if;

  if v_plan_id is null then
    update public.platform_integration_events
       set status = 'failed',
           error_message = 'Plano não resolvido',
           processed_at = now()
     where id = p_event_id;
    return jsonb_build_object('status', 'failed', 'error', 'plano nao resolvido');
  end if;

  select plan_id, current_period_end
    into v_current_plan, v_current_end
  from public.workspace_subscriptions
  where workspace_id = v_workspace_id;

  -- Mesmo plano: estende a partir do fim vigente, para não encurtar um trial
  -- ou um período que o cliente já tinha. Plano diferente: recomeça agora.
  v_period_start := now();
  if v_current_plan is not distinct from v_plan_id then
    v_period_end := greatest(coalesce(v_current_end, now()), now())
                    + make_interval(days => v_days);
  else
    v_period_end := now() + make_interval(days => v_days);
  end if;

  if v_amount is not null and v_amount > 0 and v_external_payment_id is not null then
    -- Caminho completo: registra o pagamento e a assinatura atomicamente, e
    -- grava external_subscription_id — a chave que o reembolso usa depois.
    perform public.process_payment_webhook(jsonb_build_object(
      'event', 'payment.paid',
      'workspace_id', v_workspace_id,
      'plan_id', v_plan_id,
      'provider', v_integration.provider_slug,
      'external_payment_id', v_external_payment_id,
      'amount_cents', v_amount,
      'payment_method', v_payment_method,
      'period_start', v_period_start,
      'period_end', v_period_end
    ));
    v_outcome := 'assinatura e pagamento registrados';
  else
    -- Sem valor utilizável (cupom de 100%, bump gratuito): workspace_payments
    -- tem check (amount_cents > 0) e recusaria a linha. O acesso é o requisito;
    -- o registro financeiro é acessório.
    insert into public.workspace_subscriptions (
      workspace_id, plan_id, status,
      current_period_start, current_period_end, external_subscription_id
    )
    values (
      v_workspace_id, v_plan_id, 'active',
      v_period_start, v_period_end, v_external_payment_id
    )
    on conflict (workspace_id) do update set
      plan_id = excluded.plan_id,
      status = 'active',
      current_period_start = excluded.current_period_start,
      current_period_end = excluded.current_period_end,
      external_subscription_id = coalesce(
        excluded.external_subscription_id,
        workspace_subscriptions.external_subscription_id
      ),
      updated_at = now();

    v_outcome := 'assinatura concedida sem registro de pagamento';
  end if;

  update public.platform_integration_events
     set status = 'processed',
         outcome = v_outcome,
         workspace_id = v_workspace_id,
         error_message = null,
         processed_at = now()
   where id = p_event_id;

  return jsonb_build_object(
    'status', 'done',
    'event_id', p_event_id,
    'workspace_id', v_workspace_id,
    'plan_id', v_plan_id,
    'period_end', v_period_end,
    'outcome', v_outcome
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 3) Finalização após criação de usuário (chamada pela Edge Function)
-- ---------------------------------------------------------------------------

create or replace function public.integration_finalize_purchase(
  p_event_id uuid,
  p_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  return public.integration_grant_access(p_event_id, p_user_id);
exception when others then
  update public.platform_integration_events
     set status = 'failed',
         error_message = sqlerrm,
         processed_at = now()
   where id = p_event_id;
  return jsonb_build_object('status', 'failed', 'error', sqlerrm);
end;
$$;

-- ---------------------------------------------------------------------------
-- 4) Marcar falha vinda da Edge Function
-- ---------------------------------------------------------------------------

create or replace function public.integration_mark_failed(
  p_event_id uuid,
  p_message text
)
returns void
language sql
security definer
set search_path = public
as $$
  update public.platform_integration_events
     set status = 'failed',
         error_message = left(coalesce(p_message, 'erro desconhecido'), 500),
         processed_at = now()
   where id = p_event_id;
$$;

-- ---------------------------------------------------------------------------
-- 5) Ingestão
-- ---------------------------------------------------------------------------

create or replace function public.integration_ingest_event(
  p_token text,
  p_payload jsonb,
  p_source_ip text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_integration public.platform_integrations%rowtype;
  v_event_id uuid;
  v_existing public.platform_integration_events%rowtype;
  v_event_key text;
  v_recent integer;
  v_resolved jsonb;
  v_errors jsonb;
  v_plan_id text;
  v_user_id uuid;
  v_email text;
  v_external_payment_id text;
  v_workspace_id uuid;
  v_payment_id uuid;
  v_pending_refund boolean;
begin
  select * into v_integration
  from public.platform_integrations
  where token = p_token;

  if not found then
    return jsonb_build_object('status', 'unknown_token');
  end if;

  -- Guarda de taxa por integração. Não protege contra token inválido (aquele
  -- já saiu acima sem tocar o banco), mas evita que uma plataforma em loop
  -- encha a tabela.
  select count(*) into v_recent
  from public.platform_integration_events
  where integration_id = v_integration.id
    and created_at > now() - interval '1 minute';

  if v_recent > 300 then
    return jsonb_build_object('status', 'rate_limited');
  end if;

  -- Chave de idempotência: o id do pedido quando mapeado, senão o hash do
  -- payload (jsonb::text é canônico, então o hash é estável).
  v_event_key := nullif(btrim(
    public.integration_extract_text(p_payload, v_integration.field_mapping -> 'externalPaymentId')
  ), '');

  if v_event_key is null then
    v_event_key := encode(sha256(convert_to(p_payload::text, 'UTF8')), 'hex');
  end if;

  select * into v_existing
  from public.platform_integration_events
  where integration_id = v_integration.id
    and event_key = v_event_key;

  if found then
    -- Colisão é um CLAIM, não um veredito. Só um evento já processado é
    -- descartado; um que parou em 'captured'/'failed' é retomado na mesma
    -- linha — senão um finalize que falhou por rede ficaria órfão para
    -- sempre, com o usuário criado e sem assinatura.
    if v_existing.status = 'processed' then
      return jsonb_build_object(
        'status', 'duplicate',
        'event_id', v_existing.id
      );
    end if;

    v_event_id := v_existing.id;

    update public.platform_integration_events
       set payload = p_payload,
           status = 'captured',
           outcome = null,
           error_message = null,
           source_ip = coalesce(p_source_ip, source_ip),
           processed_at = null
     where id = v_event_id;
  else
    insert into public.platform_integration_events (
      integration_id, event_key, payload, status, source_ip
    )
    values (
      v_integration.id, v_event_key, p_payload, 'captured', p_source_ip
    )
    returning id into v_event_id;
  end if;

  -- A partir daqui qualquer erro precisa sobreviver como registro. Sem este
  -- bloco, um cast quebrado faria rollback do insert acima e o admin não teria
  -- nada para depurar.
  begin
    -- Integração desativada ou ainda sem mapeamento: este é o caminho do
    -- evento de teste, que existe justamente para alimentar o mapeamento.
    if not v_integration.enabled
       or v_integration.field_mapping = '{}'::jsonb
       or v_integration.field_mapping is null
    then
      update public.platform_integration_events
         set outcome = case
               when v_integration.field_mapping = '{}'::jsonb
                 or v_integration.field_mapping is null
               then 'Evento capturado para mapeamento'
               else 'Integração desativada'
             end
       where id = v_event_id;

      return jsonb_build_object('status', 'captured', 'event_id', v_event_id);
    end if;

    v_resolved := public.integration_apply_mapping(
      v_integration.field_mapping, p_payload, v_integration.kind
    );

    if not (v_resolved ->> 'eventAccepted')::boolean then
      update public.platform_integration_events
         set status = 'ignored',
             resolved = v_resolved,
             outcome = format(
               'Evento "%s" fora da lista aceita por esta integração',
               coalesce(v_resolved ->> 'eventValue', 'sem tipo')
             ),
             processed_at = now()
       where id = v_event_id;

      return jsonb_build_object('status', 'ignored', 'event_id', v_event_id);
    end if;

    v_errors := v_resolved -> 'errors';
    if jsonb_array_length(coalesce(v_errors, '[]'::jsonb)) > 0 then
      update public.platform_integration_events
         set status = 'failed',
             resolved = v_resolved,
             error_message = (
               select string_agg(value, '; ')
               from jsonb_array_elements_text(v_errors)
             ),
             processed_at = now()
       where id = v_event_id;

      return jsonb_build_object('status', 'failed', 'event_id', v_event_id);
    end if;

    v_email := v_resolved ->> 'email';
    v_external_payment_id := v_resolved ->> 'externalPaymentId';

    -- ===================== REEMBOLSO =====================
    if v_integration.kind = 'refund' then
      -- Procura o pagamento original: primeiro no escopo da plataforma,
      -- depois em qualquer provedor (o admin pode ter trocado o slug).
      if v_external_payment_id is not null then
        select id, workspace_id into v_payment_id, v_workspace_id
        from public.workspace_payments
        where provider = v_integration.provider_slug
          and external_payment_id = v_external_payment_id
        limit 1;

        if v_payment_id is null then
          select id, workspace_id into v_payment_id, v_workspace_id
          from public.workspace_payments
          where external_payment_id = v_external_payment_id
          order by created_at desc
          limit 1;
        end if;
      end if;

      if v_workspace_id is null and v_email is not null then
        select w.id into v_workspace_id
        from auth.users u
        join public.workspaces w on w.owner_id = u.id
        where lower(u.email) = v_email
        order by w.created_at asc
        limit 1;
      end if;

      if v_workspace_id is null then
        update public.platform_integration_events
           set status = 'ignored',
               resolved = v_resolved,
               outcome = 'Nenhuma compra encontrada para este reembolso',
               processed_at = now()
         where id = v_event_id;

        return jsonb_build_object('status', 'ignored', 'event_id', v_event_id);
      end if;

      if v_payment_id is not null then
        update public.workspace_payments
           set status = 'refunded'
         where id = v_payment_id;

        -- Escopado pela compra reembolsada: cancelar incondicionalmente
        -- derrubaria um upgrade posterior que o cliente ainda está pagando.
        update public.workspace_subscriptions
           set status = 'canceled', updated_at = now()
         where workspace_id = v_workspace_id
           and external_subscription_id = v_external_payment_id;

        if not found then
          update public.platform_integration_events
             set status = 'ignored',
                 resolved = v_resolved,
                 workspace_id = v_workspace_id,
                 outcome = 'Pagamento estornado, mas a assinatura vigente é de outra compra',
                 processed_at = now()
           where id = v_event_id;

          return jsonb_build_object('status', 'ignored', 'event_id', v_event_id);
        end if;
      else
        -- Sem pagamento localizado, resta cancelar o plano vigente do
        -- comprador — que é o requisito: retirar o acesso.
        update public.workspace_subscriptions
           set status = 'canceled', updated_at = now()
         where workspace_id = v_workspace_id;
      end if;

      update public.platform_integration_events
         set status = 'processed',
             resolved = v_resolved,
             workspace_id = v_workspace_id,
             outcome = 'Acesso removido',
             processed_at = now()
       where id = v_event_id;

      return jsonb_build_object(
        'status', 'done',
        'event_id', v_event_id,
        'workspace_id', v_workspace_id
      );
    end if;

    -- ===================== COMPRA =====================

    -- Entrega fora de ordem: se um reembolso deste mesmo pedido já chegou e
    -- ficou sem alvo, conceder acesso agora seria liberar o que foi estornado.
    select exists (
      select 1
      from public.platform_integration_events e
      join public.platform_integrations i on i.id = e.integration_id
      where i.kind = 'refund'
        and e.event_key = v_external_payment_id
        and e.status in ('ignored', 'failed')
    ) into v_pending_refund;

    if v_pending_refund then
      update public.platform_integration_events
         set status = 'ignored',
             resolved = v_resolved,
             outcome = 'Existe reembolso pendente para este pedido — acesso não concedido',
             processed_at = now()
       where id = v_event_id;

      return jsonb_build_object('status', 'ignored', 'event_id', v_event_id);
    end if;

    -- Resolução do plano.
    if v_resolved ->> 'planId' is not null then
      select id into v_plan_id
      from public.plans
      where id = v_resolved ->> 'planId' and is_active = true;
    else
      -- Comparação case-insensitive: os códigos são opacos e o admin pode
      -- ter colado com caixa diferente da que a plataforma envia.
      select p.id into v_plan_id
      from public.plans p
      where p.is_active = true
        and exists (
          select 1
          from jsonb_array_elements_text(v_resolved -> 'planRefs') t(ref)
          where lower(btrim(t.ref)) = any (
            select lower(er) from unnest(p.external_references) er
          )
        )
      order by p.sort_order asc
      limit 1;
    end if;

    if v_plan_id is null then
      update public.platform_integration_events
         set status = 'failed',
             resolved = v_resolved,
             error_message = format(
               'Nenhum plano ativo corresponde a %s',
               coalesce(v_resolved ->> 'planId', v_resolved ->> 'planRefs')
             ),
             processed_at = now()
       where id = v_event_id;

      return jsonb_build_object('status', 'failed', 'event_id', v_event_id);
    end if;

    v_resolved := v_resolved || jsonb_build_object('resolvedPlanId', v_plan_id);

    update public.platform_integration_events
       set resolved = v_resolved
     where id = v_event_id;

    -- Comprador: resolvido em auth.users, que é a fonte da verdade do e-mail.
    -- profiles.email é um retrato do cadastro e não acompanha troca de e-mail.
    select u.id into v_user_id
    from auth.users u
    where lower(u.email) = v_email
    order by u.created_at asc
    limit 1;

    if v_user_id is null then
      return jsonb_build_object(
        'status', 'needs_user',
        'event_id', v_event_id,
        'email', v_email,
        'full_name', v_resolved ->> 'fullName',
        'password', v_integration.default_password
      );
    end if;

    return public.integration_grant_access(v_event_id, v_user_id);

  exception when others then
    update public.platform_integration_events
       set status = 'failed',
           error_message = left(sqlstate || ': ' || sqlerrm, 500),
           processed_at = now()
     where id = v_event_id;

    return jsonb_build_object(
      'status', 'failed',
      'event_id', v_event_id,
      'error', sqlerrm
    );
  end;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6) Reprocessar um evento pelo painel
-- ---------------------------------------------------------------------------

create or replace function public.integration_reprocess_event(p_event_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.platform_integration_events%rowtype;
  v_token text;
begin
  select * into v_event
  from public.platform_integration_events
  where id = p_event_id;

  if not found then
    return jsonb_build_object('status', 'failed', 'error', 'evento nao encontrado');
  end if;

  select token into v_token
  from public.platform_integrations
  where id = v_event.integration_id;

  -- Zera o processamento anterior para que a retomada da ingestão assuma.
  update public.platform_integration_events
     set status = 'captured', outcome = null, error_message = null, processed_at = null
   where id = p_event_id;

  return public.integration_ingest_event(v_token, v_event.payload, v_event.source_ip);
end;
$$;

-- ---------------------------------------------------------------------------
-- 7) Least privilege
-- ---------------------------------------------------------------------------

revoke all on function public.integration_grant_access(uuid, uuid) from anon, authenticated, public;
revoke all on function public.integration_finalize_purchase(uuid, uuid) from anon, authenticated, public;
revoke all on function public.integration_mark_failed(uuid, text) from anon, authenticated, public;
revoke all on function public.integration_ingest_event(text, jsonb, text) from anon, authenticated, public;
revoke all on function public.integration_reprocess_event(uuid) from anon, authenticated, public;

grant execute on function public.integration_finalize_purchase(uuid, uuid) to service_role;
grant execute on function public.integration_mark_failed(uuid, text) to service_role;
grant execute on function public.integration_ingest_event(text, jsonb, text) to service_role;
grant execute on function public.integration_reprocess_event(uuid) to service_role;
