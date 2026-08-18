alter table public.quizzes
  add column published_at timestamptz,
  add column published_content jsonb;

create unique index quizzes_slug_global_idx on public.quizzes (slug);

create policy "Public can view published quizzes"
  on public.quizzes for select
  to anon
  using (status = 'published');
