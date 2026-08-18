# Edge Functions

## `webhook-in`

Recebe eventos das plataformas de venda (Hotmart, Kiwify, Greenn, etc.).

- URL: `https://<projeto>.supabase.co/functions/v1/webhook-in/<token>`
- Autenticação: token na URL (integração criada no admin)
- **JWT do Supabase deve estar desligado** — plataformas externas não enviam Bearer JWT

```bash
npm run functions:deploy:webhook
# ou: npx supabase functions deploy webhook-in --no-verify-jwt
```

Sem `--no-verify-jwt`, o gateway responde **401** e o evento de teste falha.

Config local em `supabase/config.toml`:

```toml
[functions.webhook-in]
verify_jwt = false
```

Detalhes do go-live: [`SETUP.md`](../../SETUP.md).
