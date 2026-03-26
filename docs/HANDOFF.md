# Handoff

Este documento resume o que um novo mantenedor precisa saber para continuar o projeto sem depender do historico da conversa.

## Resumo Executivo

FluxoCasa esta publicado, funcional e com cobertura automatizada dos fluxos principais.

Links:

- producao: [fluxocasa.vercel.app](https://fluxocasa.vercel.app)
- repositorio: [Jampras/fluxocasa](https://github.com/Jampras/fluxocasa)

## Stack Atual

- Next.js 15 App Router
- React 18
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL / Supabase em producao
- SQLite em fallback local
- Supabase Auth com Google
- Vitest
- Playwright
- Vercel

## Estado Atual do Produto

O sistema cobre:

- login Google em ambiente com Supabase
- onboarding de casa
- painel, gerenciar, anotacoes e configuracoes
- CRUD completo dos registros financeiros principais
- recorrencia
- saude financeira
- auditoria da casa
- gestao de moradores
- mural de anotacoes com realtime seguro e reorder

## Arquivos para Ler Primeiro

1. [README.md](C:/Users/Jotape/Desktop/contas/README.md)
2. [docs/ARCHITECTURE.md](C:/Users/Jotape/Desktop/contas/docs/ARCHITECTURE.md)
3. [docs/API_CONTRACTS.md](C:/Users/Jotape/Desktop/contas/docs/API_CONTRACTS.md)
4. [docs/DEPLOYMENT.md](C:/Users/Jotape/Desktop/contas/docs/DEPLOYMENT.md)
5. [docs/PRODUCT_MVP.md](C:/Users/Jotape/Desktop/contas/docs/PRODUCT_MVP.md)

## Fluxo Tecnico Recomendado

Ao mexer em funcionalidade:

1. atualizar contratos em `src/types`
2. ajustar schema `zod` em `src/server/validation`
3. implementar regra no repository
4. expor no service
5. ligar em API ou pagina
6. validar com testes
7. atualizar docs se o comportamento mudar

## Pontos Importantes

- `apiHandler` e o ponto central de validacao, auth e tratamento de erro das APIs
- `repositories` carregam a maior parte da regra de negocio e montagem de snapshot
- `revalidateAppViews()` agora trabalha com presets granulares por dominio
- o painel, o gerenciar e o historico recente usam navegacao por item com `focus`
- `/calendario`, `/casa` e `/pessoal` sao apenas redirecionamentos legados
- `/metas` e apenas redirecionamento legado para `/anotacoes`
- a suite E2E cria sessao assinada localmente, sem expor rotas de teste no build
- o realtime de anotacoes depende de `scripts/notes_realtime_rls.sql` aplicado no Supabase/Postgres

## Ambientes

### Producao

- Vercel
- Supabase
- PostgreSQL
- login Google

### Local

Pode rodar com SQLite ou Postgres / Supabase, mas o fluxo de produto continua Google-only.

## Validacao Minima Antes de Subir

```bash
npm run lint
npm run build
npm run test:unit
npm run test:integration
```

## Atencao Especial

- nao assumir que `build` tolera execucoes concorrentes mexendo em `.next`
- manter `NEXT_PUBLIC_APP_URL` coerente com o ambiente publicado
- o gargalo principal restante de UX/performance hoje esta em leituras consolidadas e graficos mais pesados
