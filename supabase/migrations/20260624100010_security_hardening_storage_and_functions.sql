-- 1) Bucket público não precisa de policy SELECT ampla; ela permite LISTAR/enumerar
--    todos os arquivos de todos os tenants. URLs públicas continuam funcionando.
drop policy if exists "Public can read quiz assets" on storage.objects;

-- 2) Corrige search_path mutável (hardening contra hijack de search_path).
alter function public.set_updated_at() set search_path = '';

-- 3) Least privilege: funções de trigger não devem ser executáveis via RPC.
revoke all on function public.set_updated_at() from anon, authenticated, public;
revoke all on function public.handle_new_user() from anon, authenticated, public;
revoke all on function public.set_quiz_step_workspace_id() from anon, authenticated, public;
revoke all on function public.set_quiz_widget_workspace_id() from anon, authenticated, public;
revoke all on function public.guard_workspace_name_update() from anon, authenticated, public;

-- 4) Least privilege: estas funções exigem usuário autenticado; remove do anon.
revoke execute on function public.get_quiz_statistics(uuid, integer) from anon;
revoke execute on function public.accept_workspace_invitation(text) from anon;
revoke execute on function public.is_workspace_member(uuid) from anon;
revoke execute on function public.is_workspace_admin(uuid) from anon;
revoke execute on function public.get_user_workspace_role(uuid) from anon;
