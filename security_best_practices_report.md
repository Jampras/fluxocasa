# Relatorio de Seguranca - FluxoCasa

## Resumo executivo

O pacote principal de endurecimento foi concluido. O produto agora opera com login Google-only, o callback OAuth exige e-mail verificado antes de sincronizar identidades, as rotas publicas de teste sairam do build, a autenticacao server-side parou de aceitar fallback por e-mail em runtime e os cookies `Secure` passaram a depender de configuracao canonica do ambiente, nao de headers da requisicao.

Na varredura final, nao encontrei mais falhas criticas ou altas expostas diretamente pela app publicada. Os pontos restantes sao de endurecimento adicional e operacao segura de longo prazo.

## Correcao aplicada nesta leva

- Login manual removido da superficie publica; o produto ficou Google-only.
- Callback OAuth exige `email_confirmed_at` em [`src/app/auth/callback/route.ts`](C:/Users/Jotape/Desktop/contas/src/app/auth/callback/route.ts#L35).
- Vinculacao por e-mail no repositório agora depende de `emailVerified` em [`src/server/repositories/auth.repository.ts`](C:/Users/Jotape/Desktop/contas/src/server/repositories/auth.repository.ts#L20).
- Resolucao de usuario autenticado via Supabase ficou restrita a `authUserId` em [`src/server/auth/api.ts`](C:/Users/Jotape/Desktop/contas/src/server/auth/api.ts#L17) e [`src/server/auth/user.ts`](C:/Users/Jotape/Desktop/contas/src/server/auth/user.ts#L12).
- Politica de cookie `Secure` ficou baseada em ambiente canonico em [`src/server/auth/session.ts`](C:/Users/Jotape/Desktop/contas/src/server/auth/session.ts#L22).
- Endpoints manuais `/api/auth/login` e `/api/auth/register` foram removidos do app.
- Rotas publicas de teste nao fazem mais parte do build; a suite E2E cria sessao localmente no browser context.
- A rota legado `/api/casa/[id]` ja responde como removida e nao executa mutacao fake.

## Achados residuais

### SEC-011 - Medio - CSP ainda esta permissiva para scripts inline e imagens externas amplas

- Local:
  - [`next.config.mjs`](C:/Users/Jotape/Desktop/contas/next.config.mjs#L27)
- Evidencia:
  - `script-src 'self' 'unsafe-inline'`
  - `style-src 'self' 'unsafe-inline'`
  - `img-src 'self' data: blob: https:`
- Impacto:
  - a aplicacao ja esta melhor protegida por React, CSP e ausencia de sinks obvios, mas a politica atual ainda reduz a forca da mitigacao contra XSS e facilita carga de imagem externa ampla para tracking/exfiltracao visual.
- Recomendacao:
  - migrar para nonces/hashes quando o layout permitir
  - revisar se `script-src` precisa mesmo de `unsafe-inline`
  - restringir `img-src` aos hosts realmente usados pela aplicacao

### SEC-012 - Medio - Rate limit duravel nao possui estrategia de expiracao/limpeza dos buckets

- Local:
  - [`src/server/security/rate-limit.ts`](C:/Users/Jotape/Desktop/contas/src/server/security/rate-limit.ts#L108)
  - [`prisma/schema.prisma`](C:/Users/Jotape/Desktop/contas/prisma/schema.prisma#L160)
- Evidencia:
  - a tabela `RateLimitBucket` persiste buckets por `scope + identifier`
  - o codigo recicla janela logica, mas nao existe job de limpeza fisica para entradas antigas
- Impacto:
  - em producao de longo prazo ou sob abuso, a tabela pode crescer indefinidamente e virar custo operacional desnecessario no banco
- Recomendacao:
  - adicionar limpeza periodica por `updatedAt`
  - ou TTL/cron operacional para remover buckets antigos

### SEC-013 - Baixo/Medio - Bypass de rate limit continua liberado em qualquer host `localhost`

- Local:
  - [`src/server/security/rate-limit.ts`](C:/Users/Jotape/Desktop/contas/src/server/security/rate-limit.ts#L45)
- Evidencia:
  - `shouldBypassRateLimit()` retorna `true` para qualquer request cujo `hostname` resolva para `localhost` ou `127.0.0.1`
- Impacto:
  - isso e aceitavel para desenvolvimento local, mas vira uma permissao operacional ampla se algum ambiente de staging/self-hosting expuser a app por loopback via proxy/tunel local
- Recomendacao:
  - atrelar o bypass tambem a uma flag dedicada de desenvolvimento
  - documentar explicitamente que ambientes acessiveis externamente nao devem rodar com essa suposicao de loopback

## Ordem recomendada

1. Endurecer a CSP para reduzir `unsafe-inline` e abrir menos `img-src` (`SEC-011`).
2. Adicionar limpeza automatica da tabela de rate limit (`SEC-012`).
3. Restringir ainda mais o bypass local do rate limit (`SEC-013`).

## Validacao usada

- `npm run lint`
- `npm run build`
- `npm run test:unit`
- `npm run test:integration`

## Conclusao

O backend e a camada HTTP ficaram significativamente mais robustos do que no ciclo anterior. O que resta agora nao bloqueia producao, mas vale ser tratado como endurecimento incremental para manter o custo operacional baixo e a postura de seguranca consistente ao longo do tempo.
