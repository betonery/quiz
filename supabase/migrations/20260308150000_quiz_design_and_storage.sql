alter table public.quizzes
  add column if not exists design_settings jsonb not null default '{}'::jsonb;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'quiz-assets',
  'quiz-assets',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do nothing;

create policy "Public can read quiz assets"
  on storage.objects for select
  to public
  using (bucket_id = 'quiz-assets');

create policy "Workspace members can upload quiz assets"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'quiz-assets'
    and public.is_workspace_member(((storage.foldername(name))[1])::uuid)
  );

create policy "Workspace members can update quiz assets"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'quiz-assets'
    and public.is_workspace_member(((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'quiz-assets'
    and public.is_workspace_member(((storage.foldername(name))[1])::uuid)
  );

create policy "Workspace members can delete quiz assets"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'quiz-assets'
    and public.is_workspace_member(((storage.foldername(name))[1])::uuid)
  );
