# Setup — instalar a sua cópia da plataforma

Este guia deixa uma instalação funcional a partir do código. **Rodar só as migrations não basta**: você também precisa de projeto Supabase, variáveis de ambiente, Auth, Edge Function do webhook e o primeiro admin.

## Pré-requisitos

- Node.js 20+
- Conta [Supabase](https://supabase.com) e CLI (`npx supabase`)
- Hosting (ex.: Vercel) ou `npm run dev` local

## 1. Projeto Supabase

1. Crie um projeto no painel Supabase.
2. No repositório:

```bash
npx supabase login
npx supabase link --project-ref <SEU_PROJECT_REF>
npm run db:push
```

Isso aplica o schema (workspaces, quizzes, planos, admin, integrações, etc.).

> **pg_cron:** a migration de expiração de assinaturas agenda um job. Se o projeto não tiver a extensão, o push pode falhar nesse passo — remova/comente o agendamento na migration ou use um agendador externo (documentado em `.env.example`).

## 2. Variáveis de ambiente

```bash
cp .env.example .env.local
```

Preencha no mínimo:

| Variável                        | Onde pegar                                                  |
| ------------------------------- | ----------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Project Settings → API                                      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API                                      |
| `SUPABASE_SERVICE_ROLE_KEY`     | Project Settings → API (secret)                             |
| `NEXT_PUBLIC_APP_URL`           | URL do app (`http://localhost:3000` ou domínio de produção) |

Opcional (domínios custom de quiz): `VERCEL_API_TOKEN`, `VERCEL_PROJECT_ID`, `VERCEL_TEAM_ID`.

## 3. Auth (obrigatório em produção)

No painel Supabase → **Authentication → URL Configuration**:

- **Site URL:** o mesmo valor de `NEXT_PUBLIC_APP_URL`
- **Redirect URLs:** `https://seu-dominio.com/auth/callback` (e `http://localhost:3000/auth/callback` no dev)

### Confirmação de e-mail (padrão do produto)

Em **Authentication → Providers → Email**, deixe **Confirm email desligado**.

- Alinhado ao local: `supabase/config.toml` → `enable_confirmations = false`
- Com isso, o cadastro em `/register` devolve sessão na hora e o usuário vai direto ao dashboard
- O app ainda aceita confirmação ligada (mostra “verifique seu e-mail” se o Auth não devolver sessão)

`/auth/callback` continua necessário para **reset de senha** (e magic links), mesmo sem confirmação no signup.

SMTP / templates no painel são úteis sobretudo para **forgot-password**. Os templates **não** vêm versionados neste repositório.

## 4. Edge Function do webhook de vendas

As plataformas de pagamento chamam a função **sem** JWT do Supabase. O token na URL autentica o endpoint.

```bash
npm run functions:deploy:webhook
```

Equivalente a:

```bash
npx supabase functions deploy webhook-in --no-verify-jwt
```

Confirme no dashboard que `verify_jwt` está **desligado**. Sem isso, o teste da plataforma retorna 401.

## 5. App

```bash
npm install
npm run dev
```

Crie a primeira conta em `/register`.

## 6. Promover o primeiro admin

Com a conta já criada:

```bash
npm run setup:promote-admin -- --email=seu@email.com
```

Isso exige `SUPABASE_SERVICE_ROLE_KEY` e a URL do projeto no `.env.local`. Depois acesse `/admin`.

## 7. Configurar a plataforma no painel

Em `/admin/settings`:

1. **Marca** — nome, descrição, logo, favicon, cores, textos do hero da landing
2. **Disponibilidade / cadastros / trial** — conforme o seu modelo
3. `/admin/plans` — preços, `checkout_url` e `external_references` alinhados à sua plataforma de pagamento
4. `/admin/integrations` — criar integração, copiar URL do webhook, mapear campos após um evento de teste, ativar

## 8. Validar

1. GET na URL do webhook → `{ "ok": true }`
2. Evento de teste da plataforma → status sucesso e evento `captured` no admin
3. Publicar um quiz e abrir a URL pública

## Checklist rápido

- [ ] `npm run db:push`
- [ ] `.env.local` preenchido
- [ ] Auth Site URL + Redirect URLs
- [ ] `npm run functions:deploy:webhook` (`--no-verify-jwt`)
- [ ] Conta criada + `setup:promote-admin`
- [ ] Marca e planos no admin
- [ ] Integração de pagamento testada

## O que as migrations já entregam

- Schema completo + RLS
- Planos iniciais `starter` / `pro` (ajuste checkout no admin)
- Linha de `platform_settings` (incluindo defaults de marca)
- RPCs de billing e ingestão de webhooks

## O que as migrations não fazem

- Deploy da Edge Function
- Configuração de Auth / SMTP
- Promoção do admin
- Preenchimento das suas URLs de checkout e da marca
