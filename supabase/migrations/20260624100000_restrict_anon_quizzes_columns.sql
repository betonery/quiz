-- Impede que o papel anon leia colunas sensíveis/rascunho de quizzes publicados
-- (flow_layout contém tokens de webhook; design_settings/variables/settings são rascunho).
-- A RLS continua restringindo as LINHAS a status='published'; aqui restringimos as COLUNAS.
revoke select on public.quizzes from anon;

grant select (
  id,
  workspace_id,
  title,
  slug,
  status,
  created_by,
  created_at,
  updated_at,
  published_at,
  published_content
) on public.quizzes to anon;
