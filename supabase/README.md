# Supabase

Backend do projeto (Auth, Postgres, Storage, Edge Functions).

## Estrutura

- `migrations/` — schema completo (workspaces, quizzes, billing, admin, integrações)
- `functions/webhook-in/` — webhook de entrada das plataformas de venda
- `seed/branding.sql` — defaults de marca (opcional em `db reset`)

## Importante

**Só aplicar migrations não deixa a instalação pronta.** Veja o runbook completo em [`SETUP.md`](../SETUP.md).

Você ainda precisa:

1. Variáveis de ambiente do app (`.env.example`)
2. Auth: Site URL + Redirect URLs no painel Supabase
3. Deploy da Edge Function com JWT desligado
4. Promover o primeiro admin (`npm run setup:promote-admin`)
5. SMTP / templates de e-mail (painel Supabase; não versionados aqui)
6. `pg_cron` disponível, ou fallback externo para expirar assinaturas

## Comandos

```bash
npx supabase login
npx supabase link --project-ref <PROJECT_REF>
npm run db:push
npm run functions:deploy:webhook   # --no-verify-jwt obrigatório
```

Gerar tipos (ambiente local):

```bash
npx supabase start
npx supabase gen types typescript --local > src/types/database.types.ts
```

## Convenções

- RLS habilitado nas tabelas de negócio
- Multi-tenant por `workspace_id` / membership
- Painel de plataforma usa service role atrás de guards em `profiles.platform_role`
- Branding white-label em `platform_settings` (editável em `/admin/settings`)
