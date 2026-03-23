# FluxoCasa

MVP funcional do FluxoCasa com `Next.js`, `TypeScript`, `Tailwind CSS`, `Prisma`, `Supabase Auth` e preparo para deploy na `Vercel`.

## Como rodar

```bash
npm install
npm run db:init
npx prisma generate
npm run dev
```

Para validar o build de producao local:

```bash
npm run lint
npm run build
npm start
```

## Estrutura

- `src/app`: paginas e handlers do App Router
- `src/components`: interface reutilizavel e formularios cliente
- `src/config`: rotas, navegacao, metadados e ambiente
- `src/server/auth`: sessao, senha, guards e leitura do usuario autenticado
- `src/server/http`: helpers de resposta padronizada
- `src/server/repositories`: unica fonte de acesso aos dados do dominio
- `src/server/services`: casos de uso para paginas e APIs
- `src/server/validation`: schemas `zod` para payloads de escrita
- `src/types`: contratos compartilhados entre pagina, API e UI
- `prisma/schema.prisma`: modelagem do banco
- `prisma/init.sql`: bootstrap deterministico do SQLite local

## Estado atual

- Login com Google via Supabase Auth
- Callback OAuth com sincronizacao para `Morador`
- Criacao de casa e entrada por codigo de convite
- Dashboard, casa, pessoal e moradores lendo do banco
- CRUD de contribuicoes, contas da casa, renda, contas pessoais, gastos e metas
- Regra mensal persistida em `CicloMensal` com saldo inicial, variacao e saldo final
- Gestao de convite com copia e rotacao protegida por role de administrador
- Transferencia de administracao e remocao de moradores via API e UI
- Auditoria central de casa para criacao, entrada, convite, troca de admin e remocao
- Schema Prisma alternavel entre SQLite local e Postgres/Supabase
- Vercel Analytics e Speed Insights ligados no layout global
- Arquitetura centralizada em `repository -> service -> page/api -> component`

## Banco local

O ambiente atual usa SQLite por padrao para manter o MVP executavel sem dependencia externa.

- Arquivo local: `prisma/dev.db`
- Bootstrap: `npm run db:init`
- Client Prisma: `npx prisma generate`

Quando o ambiente permitir migrations Prisma estaveis, o projeto pode sair de `init.sql` para migrations sem alterar as camadas superiores.

## Troca para Postgres ou Supabase

O projeto agora tem duas variantes de schema Prisma:

- `prisma/schema.sqlite.prisma`
- `prisma/schema.postgres.prisma`

Fluxo de troca:

1. `npm run db:use:postgres`
2. Ajustar `DATABASE_URL` e `DIRECT_URL` no `.env`
3. `npm run prisma:generate`
4. `npm run db:push`

Para voltar ao modo local:

1. `npm run db:use:sqlite`
2. `npm run prisma:generate`
3. `npm run db:init`

## Proximos passos

1. Criar suite de testes automatizados para fluxos criticos.
2. Adicionar captura estruturada de erros e tracing.
3. Adicionar pagina dedicada de historico da casa com filtros por evento.
4. Fechar o primeiro deploy integrado GitHub + Vercel + Supabase.

Mais detalhes em [ARCHITECTURE.md](docs/ARCHITECTURE.md), [HANDOFF.md](docs/HANDOFF.md), [PRODUCT_MVP.md](docs/PRODUCT_MVP.md), [API_CONTRACTS.md](docs/API_CONTRACTS.md), [DEPLOYMENT.md](docs/DEPLOYMENT.md) e [ROADMAP.md](docs/ROADMAP.md).
