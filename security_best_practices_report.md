# Relatorio de Seguranca - FluxoCasa

## Resumo executivo

O projeto evoluiu bem na borda HTTP: agora existe protecao explicita de origem para mutacoes autenticadas por cookie, sanitizacao de erros, rate limiting duravel no backend e baseline de headers de seguranca com CSP. A superficie atual mais relevante ficou concentrada em quatro pontos residuais: vinculacao OAuth por e-mail sem checagem explicita de verificacao, rotas de teste ainda publicadas no build, confianca excessiva em headers de host/proto para decisoes sensiveis e uma rota legado de casa com contrato quebrado.

## Correções ja aplicadas

- Protecao CSRF/Origin no wrapper central em `/src/server/http/handler.ts:102-112`.
- Sanitizacao de erros e separacao entre `UserFacingError` e erro interno em `/src/server/http/handler.ts:169-187` e `/src/server/http/errors.ts:1-12`.
- Logs com menos exposicao de stack em producao em `/src/server/observability/logger.ts:52-68`.
- Rate limiting duravel por politica em `/src/server/security/rate-limit.ts:14-207` e integracao no handler em `/src/server/http/handler.ts:123-158`.
- Tabela persistente de buckets em `/prisma/schema.prisma:160-169`.
- Headers globais de seguranca e CSP em `/next.config.mjs:27-89`.
- Bypass E2E limitado a host local em `/src/server/auth/e2e.ts:9-18`.

## Achados residuais

### SEC-006 - Alto - Vinculacao OAuth por e-mail ocorre sem checagem explicita de e-mail verificado

- Local:
  - `/src/app/auth/callback/route.ts:31-50`
  - `/src/server/repositories/auth.repository.ts:40-50`
- Evidencia:
  - o callback aceita qualquer `user.email` retornado pelo Supabase e chama `syncAuthenticatedUser(...)`
  - o repositorio vincula `authUserId` a um morador existente apenas pelo e-mail
- Impacto:
  - se o projeto passar a aceitar outro provedor, ou se houver configuracao frouxa de identidades no Supabase, uma conta externa com e-mail nao verificado pode ser anexada a um usuario local existente
  - isso abre caminho para takeover por colisao de e-mail
- Recomendacao:
  - exigir verificacao explicita de e-mail antes de vincular por e-mail existente
  - validar `email_confirmed_at` ou sinal equivalente do provedor
  - manter allowlist de provedores aceitos para auto-link por e-mail

### SEC-007 - Medio/Alto - Rotas de teste continuam publicadas e ainda dependem de uma guarda operacional sensivel

- Local:
  - `/src/app/api/test/session/route.ts:9-28`
  - `/src/app/api/test/onboarding-session/route.ts:8-26`
  - `/src/server/auth/e2e.ts:9-18`
- Evidencia:
  - as rotas continuam no build da aplicacao e conseguem criar usuario, setar sessao e bootstrapar estado de teste
  - a barreira atual depende de `E2E_BYPASS_AUTH === "1"` e de host local
- Impacto:
  - em ambiente mal configurado, self-hosting ou cadeia de proxy pouco confiavel, essas rotas continuam sendo uma superficie de autenticacao paralela
  - mesmo corrigidas para localhost, elas permanecem desnecessariamente acessiveis como codigo publicado
- Recomendacao:
  - remover essas rotas do build normal
  - ou compilar apenas em ambiente de teste
  - se precisar mantelas, proteger com segredo dedicado e fail-closed em producao

### SEC-008 - Medio - Decisoes de cookie seguro ainda confiam em headers de host/protocolo da requisicao

- Local:
  - `/src/server/auth/session.ts:22-35`
  - `/src/server/auth/e2e.ts:35-42`
- Evidencia:
  - `shouldUseSecureCookies()` decide `secure` com base em `host` e `x-forwarded-proto`
  - o cookie de bypass E2E tambem usa essa logica
- Impacto:
  - em self-hosting ou proxy chain incorreta, a app pode tomar decisoes de cookie baseadas em headers nao confiaveis
  - isso fragiliza a garantia de `Secure` e deixa o comportamento dependente da borda de deploy
- Recomendacao:
  - derivar a politica de cookie seguro de configuracao canonica do ambiente
  - usar `NODE_ENV + APP_URL + trusted proxy` em vez de confiar diretamente no header da requisicao

### SEC-009 - Medio - Rota legado `/api/casa/[id]` aceita `id` arbitrario e retorna sucesso sem persistencia real

- Local:
  - `/src/app/api/casa/[id]/route.ts:6-19`
- Evidencia:
  - o `GET` ecoa o `id` recebido, mas retorna o snapshot da casa do usuario autenticado, ignorando o `id` na busca
  - o `PUT` responde `202 Accepted` com mensagem de atualizacao pendente, sem fazer nenhuma persistencia real
- Impacto:
  - o contrato da rota esta quebrado e pode induzir clientes, caches e futuras integracoes a assumirem que existe uma operacao real por `id`
  - isso vira ponto de confusao para autorizacao por recurso e pode mascarar regressao futura de IDOR
- Recomendacao:
  - remover a rota se ela nao for mais necessaria
  - ou implementar a semantica correta com verificacao de ownership pelo `id` real e mutacao efetiva

### SEC-010 - Baixo/Medio - Cadastro manual ainda facilita enumeracao e aceita politica de senha minima

- Local:
  - `/src/server/services/auth.service.ts:11-16`
  - `/src/server/validation/auth.ts:3-6`
  - `/src/app/api/auth/register/route.ts:8-23`
- Evidencia:
  - o cadastro retorna erro especifico para e-mail ja existente
  - a senha minima e apenas `8` caracteres, sem reforco adicional
- Impacto:
  - se o cadastro manual voltar a ser usado em algum ambiente, o endpoint facilita reconhecimento de contas existentes
  - a politica de senha fica fraca para um fluxo de credencial propria
- Recomendacao:
  - responder de forma mais neutra para colisao de e-mail
  - reforcar politica minima de senha se o login local continuar existindo
  - preferir verificacao adicional de e-mail no fluxo manual

## Ordem recomendada

1. Bloquear takeover por link de e-mail no OAuth (`SEC-006`).
2. Remover ou isolar de vez as rotas de teste (`SEC-007`).
3. Tirar a confianca em `host` e `x-forwarded-proto` para politica de cookie (`SEC-008`).
4. Remover ou corrigir a rota legado `/api/casa/[id]` (`SEC-009`).
5. Endurecer o cadastro manual para o caso de reativacao futura (`SEC-010`).
