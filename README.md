# Quiz Platform

Plataforma SaaS de criação de quizzes interativos para geração de leads, vendas de infoprodutos, funis de conversão e captação de dados para marketing.

Código pensado para ser **clonado e personalizado** (white-label): marca, cores e hero da landing editáveis em `/admin/settings`.

## Stack

| Camada    | Tecnologia                                      |
| --------- | ----------------------------------------------- |
| Frontend  | Next.js 15, TypeScript, Tailwind CSS, Shadcn/UI |
| Forms     | React Hook Form + Zod                           |
| Estado    | TanStack Query, Zustand, Context API            |
| Animações | Framer Motion                                   |
| Backend   | Supabase (Auth, Storage, Edge Functions)        |
| Deploy    | Vercel (ou equivalente)                         |

## Instalação (comprador / nova cópia)

**Migrations sozinhas não bastam.** Siga o runbook:

→ **[SETUP.md](./SETUP.md)**

Resumo:

```bash
npm install
cp .env.example .env.local   # preencha URL/keys do Supabase
npx supabase link --project-ref <REF>
npm run db:push
# Configure Auth Site URL + Redirect URLs no painel Supabase
npm run functions:deploy:webhook   # --no-verify-jwt
npm run dev
# Crie a conta em /register, depois:
npm run setup:promote-admin -- --email=seu@email.com
```

Depois, em `/admin/settings`, configure a **Marca** e os planos/integrações de pagamento.

## Desenvolvimento rápido (já com Supabase configurado)

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev                       # Servidor de desenvolvimento
npm run build                     # Build de produção
npm run lint                      # ESLint
npm run typecheck                 # TypeScript
npm run test                      # Testes unitários
npm run db:push                   # Aplica migrations no projeto linkado
npm run functions:deploy:webhook  # Deploy webhook-in sem JWT
npm run setup:promote-admin       # Promove usuário a admin
```

## Variáveis de ambiente

Veja [`.env.example`](./.env.example). Mínimo:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Opcional: `VERCEL_*` para domínios custom de quiz.  
Build sem env: `SKIP_ENV_VALIDATION=true npm run build`.

## Arquitetura

Domain Driven Folder Structure — `app/` fino, lógica em `domains/`.

```
src/
├── app/              # Rotas (App Router)
├── domains/          # auth, quiz, workspace, admin, billing, marketing...
├── components/       # UI compartilhada
├── services/         # Clientes Supabase
├── config/           # site, branding defaults, features
└── ...
```

## Personalização white-label

| O quê                            | Onde                      |
| -------------------------------- | ------------------------- |
| Nome, logo, favicon, cores, hero | `/admin/settings` → Marca |
| Planos e checkout                | `/admin/plans`            |
| Webhook de vendas                | `/admin/integrations`     |
| Manutenção / cadastros / trial   | `/admin/settings`         |

## Auth e e-mail

Site URL e Redirect URLs ficam no **painel Supabase**, não no código.

- **Confirm email: OFF** (padrão do produto) — cadastro entra logado sem verificar e-mail. Ver [`SETUP.md`](./SETUP.md).
- SMTP / templates são necessários sobretudo para **reset de senha**; sem isso, forgot-password falha em produção.
- `/auth/callback` permanece necessário mesmo com confirmação desligada.

## Licença

Defina a licença comercial adequada antes de distribuir o código.
