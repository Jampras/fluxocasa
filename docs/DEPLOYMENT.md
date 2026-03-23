# Deployment

Este documento descreve o fluxo atual de publicacao do FluxoCasa.

## Alvos Atuais

- codigo: GitHub
- app: Vercel
- banco e auth: Supabase

Links atuais:

- repositorio: [Jampras/fluxocasa](https://github.com/Jampras/fluxocasa)
- producao: [fluxocasa.vercel.app](https://fluxocasa.vercel.app)

## Variaveis de Ambiente

Campos usados pelo projeto:

```env
DATABASE_PROVIDER=postgres
DATABASE_URL=
DIRECT_URL=
APP_SECRET=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=
```

Observacoes:

- `NEXT_PUBLIC_APP_URL` deve apontar para a URL publica do ambiente
- em producao, use `https://fluxocasa.vercel.app`
- em desenvolvimento, use `http://localhost:3000`

## Supabase

### Banco

1. criar o projeto
2. copiar a `DATABASE_URL` do pooler
3. copiar a `DIRECT_URL` para operacoes Prisma
4. configurar o `.env`
5. executar:

```bash
npm run db:use:postgres
npm run prisma:generate
npm run db:push
```

### Auth com Google

No Google Cloud:

- origem JavaScript autorizada:
  - `https://SEU_PROJECT_REF.supabase.co`
- redirect URI autorizado:
  - `https://SEU_PROJECT_REF.supabase.co/auth/v1/callback`

No Supabase:

- `Authentication -> Providers -> Google`
  - preencher `Client ID`
  - preencher `Client Secret`
- `Authentication -> URL Configuration`
  - `Site URL`: `https://fluxocasa.vercel.app`
  - `Redirect URLs`:
    - `https://fluxocasa.vercel.app/auth/callback`
    - `http://localhost:3000/auth/callback`

## Desenvolvimento Local

### SQLite local

```bash
npm run db:use:sqlite
npm run prisma:generate
npm run db:init
npm run dev
```

### Postgres / Supabase localmente

```bash
npm run db:use:postgres
npm run prisma:generate
npm run db:push
npm run dev
```

## Vercel

### Fluxo atual

O projeto ja esta conectado ao repositorio no GitHub. O deploy de producao acontece por `push` no `main`.

### Passos para uma nova publicacao

1. validar localmente:

```bash
npm run lint
npm run build
npm run test:unit
npm run test:integration
```

2. commitar e subir no `main`
3. aguardar a Vercel marcar o deploy como `Ready`
4. validar a URL final

### CLI

CLI util quando necessario:

```bash
vercel whoami
vercel ls fluxocasa
vercel inspect fluxocasa.vercel.app
```

Script auxiliar presente no repositorio:

- [deploy_vercel.ps1](C:/Users/Jotape/Desktop/contas/scripts/deploy_vercel.ps1)

## Validacao Pos-deploy

Checklist minimo:

- `/login` abre corretamente
- login Google redireciona para `/dashboard`
- `/api/health` responde
- painel autenticado carrega
- criacao e edicao de renda, conta pessoal e conta da casa
- calendario e metas carregam sem erro

## Observabilidade Atual

- Vercel Analytics ligado
- Vercel Speed Insights ligado
- healthcheck em `/api/health`
- logging de request com `requestId` nas APIs

## Observacoes Operacionais

- o build local usa [`run_next_build.cjs`](C:/Users/Jotape/Desktop/contas/scripts/run_next_build.cjs) para limpar `.next` antes da compilacao
- o ambiente E2E usa `E2E_BYPASS_AUTH=1` apenas para testes Playwright
- essa configuracao nao deve ser ativada em producao
