alter table public.quiz_widgets
  drop constraint if exists quiz_widgets_type_check;

alter table public.quiz_widgets
  add constraint quiz_widgets_type_check
  check (type in ('text', 'button', 'input', 'options', 'image', 'carousel', 'audio', 'video'));

update storage.buckets
set
  file_size_limit = 15728640,
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'audio/mpeg',
    'audio/mp4',
    'audio/ogg',
    'audio/webm',
    'audio/wav'
  ]
where id = 'quiz-assets';
