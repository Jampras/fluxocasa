# Handoff

## Objetivo

Este repositório entrega o MVP funcional do FluxoCasa como base de continuidade para time de produto, design e engenharia.

## Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- Prisma
- SQLite local para desenvolvimento
- Postgres/Supabase como alvo de produção
- Supabase Auth com login Google
- Vercel Analytics e Speed Insights
- **Testing**: Vitest (Unit/Integration) & Playwright (E2E)

## Estado atual

O projeto já cobre:

- login com Google via Supabase
- sincronização do usuário autenticado para o modelo `Morador`
- onboarding de casa
- gestão financeira da casa
- gestão financeira pessoal
- gestão de moradores, convite e auditoria
- **Arquitetura**: Repository Cluster (Strangler Fig) e API Layer HOF (`apiHandler`)

## Decisões importantes

- O domínio do produto continua em `Morador`, `Casa`, `ContaCasa`, `Contribuicao` e agregados relacionados.
- O Supabase é a fonte de identidade, não de regra de negócio.
- O Prisma continua sendo a camada única de persistência do domínio.
- A decomposição de repositórios permite escalabilidade sem inflar um "God File".
- O `apiHandler` centraliza auth, validação Zod e tratamento de erros.

## Fluxo técnico esperado

1. Definir contrato em `src/types`
2. Validar payload em `src/server/validation` (usar transformers para Centavos/Date)
3. Implementar persistência no respectivo repositório em `src/server/repositories`
4. Expor caso de uso em `src/server/services` (adicionar JSDoc)
5. Consumir em `src/app/api` via `apiHandler`
6. Renderizar em `src/app` / `src/components`

## Arquivos que o time deve ler primeiro

1. [README.md](../README.md)
2. [ARCHITECTURE.md](./ARCHITECTURE.md)
3. [API_CONTRACTS.md](./API_CONTRACTS.md)
4. [PRODUCT_MVP.md](./PRODUCT_MVP.md)
5. [DEPLOYMENT.md](./DEPLOYMENT.md)

## Gaps ainda abertos

- ambiente Supabase/Vercel ainda depende de credenciais reais do usuário no `.env`
- auth por e-mail/senha foi desativado; o caminho suportado agora e Google
- historico da casa ainda aparece apenas resumido em `Moradores`

## Definicao de pronto para proximas entregas

- regra implementada no repositório e service correspondentes
- endpoint ou pagina cobrindo o fluxo usando os padrões estabelecidos
- feedback de erro previsível e tipagem completa
- documentação JSDoc e atualização do `API_CONTRACTS.md`
- testes passando (Vitest + Playwright)
