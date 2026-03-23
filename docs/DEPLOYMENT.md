# Deployment

## Alvo

- Código hospedado em GitHub
- App hospedado na Vercel
- Banco e auth no Supabase

## Supabase

### Banco

1. Criar projeto no Supabase
2. Copiar `DATABASE_URL` e `DIRECT_URL`
3. Rodar no projeto:

```bash
npm run db:use:postgres
npm run prisma:generate
npm run db:push
```

### Auth Google

1. Ativar provider Google no Supabase Auth
2. Configurar credenciais do Google no painel do Supabase
3. Adicionar redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://SEU-PROJETO.vercel.app/auth/callback`

## Variáveis de ambiente

Definir na Vercel:

- `DATABASE_PROVIDER=postgres`
- `DATABASE_URL`
- `DIRECT_URL`
- `APP_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Para desenvolvimento local, o time pode usar:

- SQLite local com `DATABASE_PROVIDER=sqlite`
- ou `vercel env pull` depois da integração com a Vercel

## Vercel

1. Publicar o repositório no GitHub
2. Importar o projeto na Vercel
3. Configurar as env vars
4. Fazer primeiro deploy
5. Validar:
   - `/api/health`
   - login com Google
   - callback `/auth/callback`
   - criação/entrada em casa

## Observabilidade

- Vercel Analytics habilitado no layout global
- Vercel Speed Insights habilitado no layout global
- `GET /api/health` para smoke test simples

## Rollback local

Se precisar voltar para SQLite:

```bash
npm run db:use:sqlite
npm run prisma:generate
npm run db:init
```
