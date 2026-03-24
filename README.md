# FluxoCasa

Aplicacao web para organizacao financeira de casa compartilhada e vida pessoal, com UI neo-brutalista, App Router do Next.js, Prisma e autenticacao via Supabase Auth com Google em producao.

Producao atual:
- App: [fluxocasa.vercel.app](https://fluxocasa.vercel.app)
- Repositorio: [Jampras/fluxocasa](https://github.com/Jampras/fluxocasa)

## Stack

- Next.js 15
- React 18
- TypeScript
- Tailwind CSS
- Prisma
- Supabase Auth
- PostgreSQL / Supabase em producao
- SQLite como fallback local
- Vitest para testes unitarios
- Playwright para integracao e E2E
- Vercel Analytics e Speed Insights

## Estado Atual

O projeto esta operando com os seguintes blocos:

- autenticacao com Google via Supabase em ambientes configurados
- fallback local de login/cadastro por e-mail e senha quando Supabase nao esta configurado
- onboarding de casa por criacao ou entrada por codigo de convite
- painel principal com cards em carrossel, calendario interativo geral e historico resumido
- tela `Gerenciar` com abas `Casa` e `Pessoal`
- tela de metas e graficos por escopo
- tela de configuracoes com perfil, casa, moradores e saida
- CRUD de:
  - contribuicoes da casa
  - contas da casa
  - rendas pessoais
  - contas pessoais
  - gastos pessoais
  - metas de categoria
- recorrencia real para contas e rendas:
  - unica
  - mensal
  - parcelada
  - fixa
- marcacao rapida de:
  - conta da casa paga
  - conta pessoal paga
  - renda recebida
- historico recente com acoes contextuais
- auditoria da casa para eventos administrativos
- cobertura automatizada de fluxos autenticados e nao autenticados
- wizard global de lancamentos com modal adaptado para mobile

## Navegacao Atual

Navegacao principal:

- `Painel` em `/dashboard`
- `Gerenciar` em `/gerenciar`
- `Metas` em `/metas`
- `Configuracoes` em `/configuracoes`

Experiencia por tela:

- `Painel`
  - cards-resumo em carrossel
  - calendario interativo geral
  - historico geral resumido
- `Gerenciar`
  - `Casa`
  - `Pessoal`
- `Metas`
  - `Geral`
  - `Pessoal`
  - `Casa`

Rotas legadas:

- `/calendario` redireciona para `/dashboard`
- `/casa` e `/pessoal` redirecionam para `/gerenciar`

As listas editaveis seguem aceitando foco por item via query string, usado pelo calendario, historico recente e links contextuais para abrir o registro correto.

## Como Rodar

### 1. Instalar dependencias

```bash
npm install
```

### 2. Escolher o banco

Modo local com SQLite:

```bash
npm run db:use:sqlite
npm run prisma:generate
npm run db:init
```

Modo Postgres / Supabase:

```bash
npm run db:use:postgres
npm run prisma:generate
npm run db:push
```

### 3. Subir o app

```bash
npm run dev
```

## Variaveis de Ambiente

Exemplo completo em [.env.example](C:/Users/Jotape/Desktop/contas/.env.example).

Campos principais:

- `DATABASE_PROVIDER`
- `DATABASE_URL`
- `DIRECT_URL`
- `APP_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`

## Scripts Principais

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test
npm run test:unit
npm run test:integration
npm run db:init
npm run db:push
npm run db:use:sqlite
npm run db:use:postgres
```

Observacao:
- `npm run build` usa [`scripts/run_next_build.cjs`](C:/Users/Jotape/Desktop/contas/scripts/run_next_build.cjs) para limpar `.next` e reduzir falhas intermitentes de build no Windows.

## Estrutura

- `src/app`
  - paginas do App Router
  - layouts
  - rotas de API
- `src/components`
  - UI compartilhada
  - formularios
  - blocos de dashboard, gerenciamento, metas e configuracoes
- `src/config`
  - rotas
  - navegacao
  - ambiente
- `src/lib`
  - cliente Prisma
  - cliente Supabase
  - helpers de cliente e utilitarios
- `src/server/auth`
  - sessao local
  - integracao Supabase server-side
  - helpers de usuario autenticado
  - bypass controlado para E2E
- `src/server/http`
  - `apiHandler`
  - helpers de resposta
  - parsing de params
- `src/server/repositories`
  - regras e acesso a dados por dominio
- `src/server/services`
  - casos de uso consumidos por paginas e APIs
- `src/server/validation`
  - schemas `zod`
- `src/types`
  - contratos compartilhados
- `prisma`
  - schema atual e utilitarios de troca de provider
- `e2e`
  - testes Playwright
- `docs`
  - documentacao complementar

## Testes

Cobertura atual:

- unitarios com Vitest
- integracao e E2E com Playwright
- fluxos autenticados com sessao de teste controlada em `E2E_BYPASS_AUTH`
- smoke tests de auth, dashboard e seguranca basica de API

Executar tudo:

```bash
npm test
```

Executar por suite:

```bash
npm run test:unit
npm run test:integration
```

## Documentacao Complementar

- [Arquitetura](C:/Users/Jotape/Desktop/contas/docs/ARCHITECTURE.md)
- [Contratos de API](C:/Users/Jotape/Desktop/contas/docs/API_CONTRACTS.md)
- [Deploy](C:/Users/Jotape/Desktop/contas/docs/DEPLOYMENT.md)
- [Produto Atual](C:/Users/Jotape/Desktop/contas/docs/PRODUCT_MVP.md)
- [Roadmap](C:/Users/Jotape/Desktop/contas/docs/ROADMAP.md)
- [Handoff](C:/Users/Jotape/Desktop/contas/docs/HANDOFF.md)
