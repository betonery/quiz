-- Defaults de marca neutros (já aplicados também pela migration de branding).
-- Útil em `supabase db reset` local se o seed for habilitado no config.

update public.platform_settings
set
  product_name = coalesce(nullif(product_name, ''), 'Quiz Platform'),
  product_description = coalesce(
    nullif(product_description, ''),
    'Plataforma de criação de quizzes interativos para geração de leads, vendas e funis de conversão.'
  ),
  primary_color = coalesce(nullif(primary_color, ''), '#0F172A'),
  secondary_color = coalesce(nullif(secondary_color, ''), '#3B82F6'),
  landing_headline = coalesce(
    nullif(landing_headline, ''),
    'Transforme visitantes em clientes com quizzes inteligentes.'
  ),
  landing_subheadline = coalesce(
    nullif(landing_subheadline, ''),
    'Crie experiências interativas, qualifique leads e aumente conversões em uma única plataforma.'
  )
where id = 1;
