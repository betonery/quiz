create index if not exists workspace_subscriptions_overdue_idx
  on public.workspace_subscriptions (current_period_end)
  where status = 'active' and current_period_end is not null;

create or replace function public.expire_overdue_subscriptions()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_canceled_count integer;
  v_workspace_ids jsonb;
begin
  with overdue as (
    update public.workspace_subscriptions
    set status = 'canceled', updated_at = now()
    where status = 'active'
      and current_period_end is not null
      and current_period_end < now() - interval '2 days'
    returning workspace_id
  )
  select
    count(*)::integer,
    coalesce(jsonb_agg(workspace_id), '[]'::jsonb)
  into v_canceled_count, v_workspace_ids
  from overdue;

  return jsonb_build_object(
    'ok', true,
    'canceled_count', v_canceled_count,
    'workspace_ids', v_workspace_ids,
    'ran_at', now()
  );
end;
$$;

revoke all on function public.expire_overdue_subscriptions() from public;
revoke all on function public.expire_overdue_subscriptions() from anon;
revoke all on function public.expire_overdue_subscriptions() from authenticated;
grant execute on function public.expire_overdue_subscriptions() to service_role;

create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'expire-overdue-subscriptions-daily',
  '0 6 * * *',
  $$ select public.expire_overdue_subscriptions(); $$
);
