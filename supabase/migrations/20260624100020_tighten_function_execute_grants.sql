-- Remove o grant implícito a PUBLIC (que o anon herda) e concede EXECUTE
-- apenas a authenticated. Estas funções já validam auth.uid()/associação
-- internamente e são necessárias para a avaliação de RLS de usuários logados.
revoke execute on function public.is_workspace_member(uuid) from public, anon;
grant execute on function public.is_workspace_member(uuid) to authenticated;

revoke execute on function public.is_workspace_admin(uuid) from public, anon;
grant execute on function public.is_workspace_admin(uuid) to authenticated;

revoke execute on function public.get_user_workspace_role(uuid) from public, anon;
grant execute on function public.get_user_workspace_role(uuid) to authenticated;

revoke execute on function public.accept_workspace_invitation(text) from public, anon;
grant execute on function public.accept_workspace_invitation(text) to authenticated;

revoke execute on function public.get_quiz_statistics(uuid, integer) from public, anon;
grant execute on function public.get_quiz_statistics(uuid, integer) to authenticated;
