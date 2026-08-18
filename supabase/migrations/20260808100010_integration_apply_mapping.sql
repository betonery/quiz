-- Avaliação do mapeamento de campos — funções PURAS, sem acesso a tabela.
--
-- A mesma função serve o preview do painel e a execução real da ingestão, para
-- que o que o admin vê ao testar seja exatamente o que vai acontecer.
--
-- Regra central: erro volta como DADO (array `errors`), nunca como exceção.
-- Um payload com `"total": "R$ 97,00"` num cast direto abortaria a transação
-- inteira da ingestão, levando junto o insert do próprio evento — e o admin
-- ficaria sem nada para depurar.

-- ---------------------------------------------------------------------------
-- 1) Extração por caminho
-- ---------------------------------------------------------------------------
-- O caminho vem do mapeamento como array JSON (["data","customer","email"]) e
-- é convertido para text[], o formato que o operador #>> aceita.

create or replace function public.integration_extract_text(
  p_payload jsonb,
  p_path jsonb
)
returns text
language sql
immutable
as $$
  select case
    when p_path is null
      or jsonb_typeof(p_path) <> 'array'
      or jsonb_array_length(p_path) = 0
      then null
    else nullif(
      btrim(p_payload #>> (select array(select jsonb_array_elements_text(p_path)))),
      ''
    )
  end;
$$;

-- ---------------------------------------------------------------------------
-- 2) Conversão de valor monetário
-- ---------------------------------------------------------------------------
-- As plataformas mandam de tudo: 9900, "99.00", "99,00", "R$ 1.234,56".
-- Usa numeric (não float) porque round(97.99::float * 100) não dá 9799.

create or replace function public.integration_parse_amount_cents(
  p_raw text,
  p_unit text
)
returns bigint
language plpgsql
immutable
as $$
declare
  v text;
  v_dot integer;
  v_comma integer;
  v_decimal_sep text;
  v_value numeric;
begin
  if p_raw is null then
    return null;
  end if;

  v := btrim(p_raw);
  if v = '' then
    return null;
  end if;

  -- Já vem em centavos: sobra apenas extrair os dígitos.
  if coalesce(p_unit, 'currency') = 'cents' then
    v := regexp_replace(v, '[^0-9]', '', 'g');
    if v = '' then
      return null;
    end if;
    return v::bigint;
  end if;

  v := regexp_replace(v, '[^0-9.,-]', '', 'g');
  if v = '' or v = '-' then
    return null;
  end if;

  -- Posição da ÚLTIMA ocorrência de cada separador.
  v_dot := case when strpos(v, '.') > 0
                then length(v) - strpos(reverse(v), '.') + 1 else 0 end;
  v_comma := case when strpos(v, ',') > 0
                  then length(v) - strpos(reverse(v), ',') + 1 else 0 end;

  if v_dot > 0 and v_comma > 0 then
    -- Ambos presentes: o último é o decimal ("1.234,56" ou "1,234.56").
    v_decimal_sep := case when v_comma > v_dot then ',' else '.' end;
  elsif v_comma > 0 then
    -- Só vírgula: decimal se sobrarem exatamente 2 dígitos ("99,00");
    -- senão é separador de milhar ("1,234").
    v_decimal_sep := case when length(v) - v_comma = 2 then ',' else null end;
  elsif v_dot > 0 then
    v_decimal_sep := case when length(v) - v_dot = 2 then '.' else null end;
  else
    v_decimal_sep := null;
  end if;

  if v_decimal_sep is null then
    v := regexp_replace(v, '[.,]', '', 'g');
  elsif v_decimal_sep = ',' then
    v := replace(replace(v, '.', ''), ',', '.');
  else
    v := replace(v, ',', '');
  end if;

  if v = '' or v = '-' then
    return null;
  end if;

  begin
    v_value := v::numeric;
  exception when others then
    return null;
  end;

  return round(v_value * 100)::bigint;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3) Conversão de inteiro tolerante
-- ---------------------------------------------------------------------------

create or replace function public.integration_parse_int(p_raw text)
returns integer
language plpgsql
immutable
as $$
declare
  v text;
begin
  if p_raw is null then
    return null;
  end if;

  v := regexp_replace(btrim(p_raw), '[^0-9-]', '', 'g');
  if v = '' or v = '-' then
    return null;
  end if;

  begin
    return v::integer;
  exception when others then
    return null;
  end;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4) Avaliação completa do mapeamento
-- ---------------------------------------------------------------------------

create or replace function public.integration_apply_mapping(
  p_mapping jsonb,
  p_payload jsonb,
  p_kind text default null
)
returns jsonb
language plpgsql
immutable
as $$
declare
  v_errors jsonb := '[]'::jsonb;
  v_email text;
  v_full_name text;
  v_external_payment_id text;
  v_payment_method text;
  v_amount_cents bigint;
  v_amount_raw text;
  v_plan jsonb;
  v_plan_mode text;
  v_plan_id text;
  v_plan_refs jsonb := '[]'::jsonb;
  v_access jsonb;
  v_days integer;
  v_filter jsonb;
  v_event_value text;
  v_event_accepted boolean := true;
  v_array jsonb;
begin
  if p_mapping is null or p_mapping = '{}'::jsonb then
    return jsonb_build_object(
      'mapped', false,
      'errors', jsonb_build_array('Mapeamento não configurado')
    );
  end if;

  -- Filtro de evento -------------------------------------------------------
  v_filter := p_mapping -> 'eventFilter';
  if v_filter is not null and jsonb_typeof(v_filter) = 'object' then
    v_event_value := public.integration_extract_text(p_payload, v_filter -> 'path');

    if jsonb_typeof(v_filter -> 'acceptedValues') = 'array'
       and jsonb_array_length(v_filter -> 'acceptedValues') > 0
    then
      v_event_accepted := exists (
        select 1
        from jsonb_array_elements_text(v_filter -> 'acceptedValues') t(value)
        where lower(btrim(t.value)) = lower(coalesce(v_event_value, ''))
      );
    end if;
  end if;

  -- Campos diretos ---------------------------------------------------------
  v_email := lower(public.integration_extract_text(p_payload, p_mapping -> 'email'));
  v_full_name := public.integration_extract_text(p_payload, p_mapping -> 'fullName');
  v_external_payment_id :=
    public.integration_extract_text(p_payload, p_mapping -> 'externalPaymentId');
  v_payment_method :=
    public.integration_extract_text(p_payload, p_mapping -> 'paymentMethod');

  -- Valor ------------------------------------------------------------------
  if jsonb_typeof(p_mapping -> 'amount') = 'object' then
    v_amount_raw := public.integration_extract_text(
      p_payload, p_mapping #> '{amount,path}'
    );
    v_amount_cents := public.integration_parse_amount_cents(
      v_amount_raw,
      p_mapping #>> '{amount,unit}'
    );

    if v_amount_raw is not null and v_amount_cents is null then
      v_errors := v_errors || to_jsonb(
        format('Valor não reconhecido: "%s"', v_amount_raw)
      );
    end if;
  end if;

  -- Plano ------------------------------------------------------------------
  v_plan := p_mapping -> 'plan';
  if jsonb_typeof(v_plan) = 'object' then
    v_plan_mode := v_plan ->> 'mode';

    if v_plan_mode = 'fixed' then
      v_plan_id := nullif(btrim(v_plan ->> 'planId'), '');

    elsif v_plan_mode = 'reference' then
      v_plan_refs := coalesce(
        (
          select jsonb_agg(ref)
          from (
            select public.integration_extract_text(p_payload, v_plan -> 'path') as ref
          ) t
          where t.ref is not null
        ),
        '[]'::jsonb
      );

    elsif v_plan_mode = 'reference_any' then
      -- Order bump é a norma: o produto principal pode não estar no índice 0,
      -- então todos os elementos do array viram candidatos.
      v_array := p_payload #> (
        select array(select jsonb_array_elements_text(v_plan -> 'arrayPath'))
      );

      if jsonb_typeof(v_array) = 'array' then
        v_plan_refs := coalesce(
          (
            select jsonb_agg(value)
            from (
              select nullif(btrim(elem ->> (v_plan ->> 'key')), '') as value
              from jsonb_array_elements(v_array) elem
            ) t
            where t.value is not null
          ),
          '[]'::jsonb
        );
      end if;
    end if;
  end if;

  -- Dias de acesso ---------------------------------------------------------
  v_access := p_mapping -> 'access';
  if jsonb_typeof(v_access) = 'object' then
    if v_access ->> 'mode' = 'path' then
      v_days := public.integration_parse_int(
        public.integration_extract_text(p_payload, v_access -> 'path')
      );
    else
      v_days := public.integration_parse_int(v_access ->> 'days');
    end if;
  end if;

  -- Obrigatórios por tipo --------------------------------------------------
  if p_kind = 'purchase' then
    if v_email is null then
      v_errors := v_errors || to_jsonb('E-mail não encontrado no payload'::text);
    end if;
    if v_external_payment_id is null then
      v_errors := v_errors || to_jsonb(
        'Identificador do pedido não encontrado no payload'::text
      );
    end if;
    if v_plan_id is null and jsonb_array_length(v_plan_refs) = 0 then
      v_errors := v_errors || to_jsonb('Plano não resolvido no payload'::text);
    end if;
    if v_days is null or v_days <= 0 then
      v_errors := v_errors || to_jsonb('Dias de acesso não resolvidos'::text);
    end if;

  elsif p_kind = 'refund' then
    if v_email is null and v_external_payment_id is null then
      v_errors := v_errors || to_jsonb(
        'Reembolso exige e-mail ou identificador do pedido'::text
      );
    end if;
  end if;

  return jsonb_build_object(
    'mapped', true,
    'email', v_email,
    'fullName', v_full_name,
    'externalPaymentId', v_external_payment_id,
    'paymentMethod', v_payment_method,
    'amountCents', v_amount_cents,
    'planId', v_plan_id,
    'planRefs', v_plan_refs,
    'days', v_days,
    'eventValue', v_event_value,
    'eventAccepted', v_event_accepted,
    'errors', v_errors
  );
end;
$$;

revoke all on function public.integration_extract_text(jsonb, jsonb)
  from anon, authenticated, public;
revoke all on function public.integration_parse_amount_cents(text, text)
  from anon, authenticated, public;
revoke all on function public.integration_parse_int(text)
  from anon, authenticated, public;
revoke all on function public.integration_apply_mapping(jsonb, jsonb, text)
  from anon, authenticated, public;

grant execute on function public.integration_apply_mapping(jsonb, jsonb, text)
  to service_role;
