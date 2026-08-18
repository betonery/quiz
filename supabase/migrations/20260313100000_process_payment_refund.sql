create or replace function public.process_payment_refund(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_workspace_id uuid;
  v_payment_id uuid;
  v_refund_external_id text;
  v_refund_payment_id uuid;
  v_original public.workspace_payments%rowtype;
  v_raw_payload jsonb;
begin
  if coalesce(payload->>'event', '') is distinct from 'payment.refunded' then
    raise exception 'evento invalido: esperado payment.refunded';
  end if;

  v_workspace_id := (payload->>'workspace_id')::uuid;
  v_payment_id := (payload->>'payment_id')::uuid;

  if v_workspace_id is null or v_payment_id is null then
    raise exception 'workspace_id e payment_id sao obrigatorios';
  end if;

  if not exists (
    select 1 from public.workspaces w where w.id = v_workspace_id
  ) then
    raise exception 'workspace nao encontrado';
  end if;

  select *
  into v_original
  from public.workspace_payments wp
  where wp.id = v_payment_id
    and wp.workspace_id = v_workspace_id;

  if not found then
    raise exception 'pagamento nao encontrado';
  end if;

  v_refund_external_id := coalesce(
    nullif(trim(payload->>'refund_external_payment_id'), ''),
    'refund_' || v_payment_id::text
  );

  v_raw_payload := payload || jsonb_build_object('original_payment_id', v_payment_id);

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
    v_original.workspace_id,
    v_original.plan_id,
    v_refund_external_id,
    v_original.provider,
    v_original.amount_cents,
    v_original.payment_method,
    v_original.period_start,
    v_original.period_end,
    'refunded',
    v_raw_payload
  )
  on conflict (provider, external_payment_id) do nothing
  returning id into v_refund_payment_id;

  if v_refund_payment_id is null then
    return jsonb_build_object(
      'ok', true,
      'duplicate', true,
      'refund_payment_id', null,
      'subscription_canceled', false
    );
  end if;

  update public.workspace_subscriptions
  set status = 'canceled', updated_at = now()
  where workspace_id = v_workspace_id;

  return jsonb_build_object(
    'ok', true,
    'duplicate', false,
    'refund_payment_id', v_refund_payment_id,
    'subscription_canceled', true
  );
end;
$$;

revoke all on function public.process_payment_refund(jsonb) from public;
revoke all on function public.process_payment_refund(jsonb) from anon;
revoke all on function public.process_payment_refund(jsonb) from authenticated;
grant execute on function public.process_payment_refund(jsonb) to service_role;
