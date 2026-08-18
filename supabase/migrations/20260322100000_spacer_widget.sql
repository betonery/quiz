alter table public.quiz_widgets
  drop constraint if exists quiz_widgets_type_check;

alter table public.quiz_widgets
  add constraint quiz_widgets_type_check
  check (type in ('text', 'button', 'input', 'options', 'image', 'carousel', 'audio', 'video', 'level', 'loading', 'redirect', 'testimonials', 'charts', 'faq', 'spacer'));
