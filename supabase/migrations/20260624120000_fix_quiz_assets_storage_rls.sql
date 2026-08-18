-- Corrige upload/leitura de assets do funil após hardening de storage.
-- 1) Policies usam EXISTS direto em workspace_members (mais confiável no Storage API).
-- 2) Restaura SELECT para membros autenticados do workspace (upsert/leitura),
--    sem reabrir listagem pública removida em 20260624100010.

drop policy if exists "Workspace members can upload quiz assets" on storage.objects;
drop policy if exists "Workspace members can update quiz assets" on storage.objects;
drop policy if exists "Workspace members can delete quiz assets" on storage.objects;
drop policy if exists "Workspace members can read quiz assets" on storage.objects;

create policy "Workspace members can read quiz assets"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'quiz-assets'
    and exists (
      select 1
      from public.workspace_members wm
      where wm.workspace_id = ((storage.foldername(name))[1])::uuid
        and wm.user_id = auth.uid()
    )
  );

create policy "Workspace members can upload quiz assets"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'quiz-assets'
    and exists (
      select 1
      from public.workspace_members wm
      where wm.workspace_id = ((storage.foldername(name))[1])::uuid
        and wm.user_id = auth.uid()
    )
  );

create policy "Workspace members can update quiz assets"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'quiz-assets'
    and exists (
      select 1
      from public.workspace_members wm
      where wm.workspace_id = ((storage.foldername(name))[1])::uuid
        and wm.user_id = auth.uid()
    )
  )
  with check (
    bucket_id = 'quiz-assets'
    and exists (
      select 1
      from public.workspace_members wm
      where wm.workspace_id = ((storage.foldername(name))[1])::uuid
        and wm.user_id = auth.uid()
    )
  );

create policy "Workspace members can delete quiz assets"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'quiz-assets'
    and exists (
      select 1
      from public.workspace_members wm
      where wm.workspace_id = ((storage.foldername(name))[1])::uuid
        and wm.user_id = auth.uid()
    )
  );
