create or replace function public.process_payment_webhook(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment_id uuid;
  v_workspace_id uuid;
  v_plan_id text;
  v_provider text;
  v_external_payment_id text;
  v_amount_cents integer;
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
    select 1 from public.plans p
    where p.id = v_plan_id and p.is_active = true
  ) then
    raise exception 'plano nao encontrado ou inativo';
  end if;

  insert into public.workspace_payments (
    workspace_id,
    plan_id,
    external_payment_id,
    provider,
    amount_cents,
    payment_method,
    period_start,
    period_end,
    status,
    raw_payload
  ) values (
    v_workspace_id,
    v_plan_id,
    v_external_payment_id,
    v_provider,
    v_amount_cents,
    payload->>'payment_method',
    (payload->>'period_start')::timestamptz,
    (payload->>'period_end')::timestamptz,
    'paid',
    payload
  )
  on conflict (provider, external_payment_id) do nothing
  returning id into v_payment_id;

  if v_payment_id is null then
    return jsonb_build_object(
      'ok', true,
      'duplicate', true,
      'subscription_updated', false,
      'payment_id', null
    );
  end if;

  insert into public.workspace_subscriptions (
    workspace_id,
    plan_id,
    status,
    current_period_start,
    current_period_end,
    external_subscription_id
  ) values (
    v_workspace_id,
    v_plan_id,
    'active',
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
    'duplicate', false,
    'subscription_updated', true,
    'payment_id', v_payment_id
  );
end;
$$;

revoke all on function public.process_payment_webhook(jsonb) from public;
revoke all on function public.process_payment_webhook(jsonb) from anon;
revoke all on function public.process_payment_webhook(jsonb) from authenticated;
grant execute on function public.process_payment_webhook(jsonb) to service_role;
