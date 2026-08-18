-- Branding white-label em platform_settings (editável no painel admin).

alter table public.platform_settings
  add column if not exists product_name text not null default 'Quiz Platform',
  add column if not exists product_description text not null
    default 'Plataforma de criação de quizzes interativos para geração de leads, vendas e funis de conversão.',
  add column if not exists logo_url text,
  add column if not exists favicon_url text,
  add column if not exists primary_color text not null default '#0F172A',
  add column if not exists secondary_color text not null default '#3B82F6',
  add column if not exists landing_headline text not null
    default 'Transforme visitantes em clientes com quizzes inteligentes.',
  add column if not exists landing_subheadline text not null
    default 'Crie experiências interativas, qualifique leads e aumente conversões em uma única plataforma.';

comment on column public.platform_settings.product_name is
  'Nome do produto exibido no app, logo texto e metadata.';
comment on column public.platform_settings.logo_url is
  'URL pública do logo. Null usa monograma gerado do nome.';
comment on column public.platform_settings.favicon_url is
  'URL pública do favicon.';
comment on column public.platform_settings.primary_color is
  'Cor primária da marca (#RRGGBB).';
comment on column public.platform_settings.secondary_color is
  'Cor secundária / CTA (#RRGGBB).';
comment on column public.platform_settings.landing_headline is
  'Headline do hero da landing.';
comment on column public.platform_settings.landing_subheadline is
  'Subheadline do hero da landing.';

alter table public.platform_settings
  drop constraint if exists platform_settings_primary_color_hex;
alter table public.platform_settings
  add constraint platform_settings_primary_color_hex
  check (primary_color ~ '^#[0-9A-Fa-f]{6}$');

alter table public.platform_settings
  drop constraint if exists platform_settings_secondary_color_hex;
alter table public.platform_settings
  add constraint platform_settings_secondary_color_hex
  check (secondary_color ~ '^#[0-9A-Fa-f]{6}$');
