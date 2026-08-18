create table public.quiz_daily_metrics (
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  metric_date date not null,
  views integer not null default 0 check (views >= 0),
  starts integer not null default 0 check (starts >= 0),
  completions integer not null default 0 check (completions >= 0),
  primary key (quiz_id, metric_date)
);

create table public.quiz_step_metrics (
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  step_id uuid not null,
  views integer not null default 0 check (views >= 0),
  primary key (quiz_id, step_id)
);

create index quiz_daily_metrics_quiz_date_idx
  on public.quiz_daily_metrics (quiz_id, metric_date desc);

alter table public.quiz_daily_metrics enable row level security;
alter table public.quiz_step_metrics enable row level security;

create or replace function public.record_quiz_analytics(
  p_quiz_id uuid,
  p_event text,
  p_step_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_date date := (timezone('utc', now())::date);
begin
  if p_event not in ('view', 'start', 'complete', 'step_view') then
    raise exception 'evento invalido';
  end if;

  if not exists (
    select 1
    from public.quizzes q
    where q.id = p_quiz_id
      and q.status = 'published'
  ) then
    return;
  end if;

  insert into public.quiz_daily_metrics (
    quiz_id,
    metric_date,
    views,
    starts,
    completions
  )
  values (
    p_quiz_id,
    v_date,
    case when p_event = 'view' then 1 else 0 end,
    case when p_event = 'start' then 1 else 0 end,
    case when p_event = 'complete' then 1 else 0 end
  )
  on conflict (quiz_id, metric_date) do update set
    views = public.quiz_daily_metrics.views + case when p_event = 'view' then 1 else 0 end,
    starts = public.quiz_daily_metrics.starts + case when p_event = 'start' then 1 else 0 end,
    completions = public.quiz_daily_metrics.completions + case when p_event = 'complete' then 1 else 0 end;

  if p_event = 'step_view' and p_step_id is not null then
    insert into public.quiz_step_metrics (quiz_id, step_id, views)
    values (p_quiz_id, p_step_id, 1)
    on conflict (quiz_id, step_id) do update set
      views = public.quiz_step_metrics.views + 1;
  end if;
end;
$$;

create or replace function public.get_quiz_statistics(
  p_quiz_id uuid,
  p_days integer default 30
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_from date;
  v_totals record;
  v_daily jsonb;
  v_steps jsonb;
begin
  if auth.uid() is null then
    raise exception 'acesso negado';
  end if;

  if not exists (
    select 1
    from public.quizzes q
    join public.workspace_members wm on wm.workspace_id = q.workspace_id
    where q.id = p_quiz_id
      and wm.user_id = auth.uid()
  ) then
    raise exception 'acesso negado';
  end if;

  v_from := (timezone('utc', now())::date) - greatest(coalesce(p_days, 30) - 1, 0);

  select
    coalesce(sum(views), 0) as views,
    coalesce(sum(starts), 0) as starts,
    coalesce(sum(completions), 0) as completions
  into v_totals
  from public.quiz_daily_metrics
  where quiz_id = p_quiz_id
    and metric_date >= v_from;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'date', metric_date,
        'views', views,
        'starts', starts,
        'completions', completions
      )
      order by metric_date
    ),
    '[]'::jsonb
  )
  into v_daily
  from public.quiz_daily_metrics
  where quiz_id = p_quiz_id
    and metric_date >= v_from;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'stepId', step_id,
        'views', views
      )
    ),
    '[]'::jsonb
  )
  into v_steps
  from public.quiz_step_metrics
  where quiz_id = p_quiz_id;

  return jsonb_build_object(
    'views', v_totals.views,
    'starts', v_totals.starts,
    'completions', v_totals.completions,
    'conversionRate', case
      when v_totals.views > 0 then round((v_totals.completions::numeric / v_totals.views) * 100, 1)
      else 0
    end,
    'daily', v_daily,
    'stepMetrics', v_steps
  );
end;
$$;

revoke all on function public.record_quiz_analytics(uuid, text, uuid) from public;
revoke all on function public.record_quiz_analytics(uuid, text, uuid) from anon;
revoke all on function public.record_quiz_analytics(uuid, text, uuid) from authenticated;
grant execute on function public.record_quiz_analytics(uuid, text, uuid) to service_role;

revoke all on function public.get_quiz_statistics(uuid, integer) from public;
grant execute on function public.get_quiz_statistics(uuid, integer) to authenticated;
grant execute on function public.get_quiz_statistics(uuid, integer) to service_role;
