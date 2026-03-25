# API Contracts

Este documento resume os contratos relevantes das APIs atuais.

## Padrao de Resposta

Helpers em [`response.ts`](C:/Users/Jotape/Desktop/contas/src/server/http/response.ts).

Status usados hoje:

- `200` para leitura, atualizacao, marcacao e remocao
- `201` para criacao
- `400` para payload invalido ou erro de regra
- `401` para sessao invalida ou expirada
- `403` para acesso proibido
- `404` quando aplicavel
- `500` para erro interno inesperado

Todas as rotas protegidas passam por [`apiHandler`](C:/Users/Jotape/Desktop/contas/src/server/http/handler.ts).

## Autenticacao

O produto usa login Google via Supabase Auth.

### `GET /auth/callback`

Efeito:

- troca o `code` do OAuth por sessao Supabase
- sincroniza o usuario autenticado no banco local
- redireciona para `/dashboard` ou `/onboarding`

### `POST /api/auth/logout`

Efeito:

- limpa sessao Supabase quando disponivel

## Onboarding

### `POST /api/onboarding/create-house`

Cria uma casa para o morador autenticado.

Body:

```json
{
  "nome": "Casa Centro"
}
```

Resposta:

- `201` com `casaId`

### `POST /api/onboarding/join-house`

Entra em uma casa existente por codigo de convite.

Body:

```json
{
  "codigoConvite": "ABC123"
}
```

Resposta:

- `201` com `casaId`

## Casa

### `GET /api/casa`

Retorna o snapshot atual da casa.

### `DELETE /api/casa`

Executa o fluxo de saida da casa para o morador autenticado.

## Contas da casa

### `GET /api/casa/contas`

Lista as contas visiveis no contexto da casa.

### `POST /api/casa/contas`

Cria conta da casa.

Body:

```json
{
  "titulo": "Aluguel",
  "categoria": "Moradia",
  "valor": 1800,
  "vencimento": "2026-03-25",
  "observacao": "Opcional",
  "frequencia": "MENSAL",
  "parcelasTotais": null
}
```

Resposta:

- `201`

### `PATCH /api/casa/contas/:id`

Marca a conta como paga.

Resposta:

- `200`

### `PUT /api/casa/contas/:id`

Atualiza a conta.

Resposta:

- `200`

### `DELETE /api/casa/contas/:id`

Remove a conta.

Resposta:

- `200`

## Contribuicoes

### `POST /api/casa/contribuicoes`

Cria ou atualiza a contribuicao do morador no ciclo atual.

Body:

```json
{
  "valor": 800,
  "mes": 3,
  "ano": 2026
}
```

### `DELETE /api/casa/contribuicoes/:id`

Remove a contribuicao.

Resposta:

- `200`

## Pessoal

### Rendas

`POST /api/pessoal/renda`

Body:

```json
{
  "titulo": "Salario",
  "categoria": "SALARIO",
  "valor": 3500,
  "recebidaEm": "2026-03-05",
  "status": "PREVISTO",
  "frequencia": "FIXA",
  "parcelasTotais": null
}
```

Regras:

- `status` pode ser `PREVISTO` ou `RECEBIDO`
- `categoria` pode ser `SALARIO` ou `EXTRA`

Rotas complementares:

- `PATCH /api/pessoal/renda/:id` marca como recebida
- `PUT /api/pessoal/renda/:id` atualiza
- `DELETE /api/pessoal/renda/:id` remove

### Contas pessoais

`POST /api/pessoal/contas`

Body:

```json
{
  "titulo": "Cartao",
  "categoria": "Financeiro",
  "valor": 420,
  "vencimento": "2026-03-28",
  "observacao": "Opcional",
  "frequencia": "UNICA",
  "parcelasTotais": null
}
```

Rotas complementares:

- `PATCH /api/pessoal/contas/:id` marca como paga
- `PUT /api/pessoal/contas/:id` atualiza
- `DELETE /api/pessoal/contas/:id` remove

### Gastos

`POST /api/pessoal/gastos`

Body:

```json
{
  "titulo": "Mercado",
  "categoria": "Alimentacao",
  "valor": 120,
  "gastoEm": "2026-03-20"
}
```

Rotas complementares:

- `PUT /api/pessoal/gastos/:id`
- `DELETE /api/pessoal/gastos/:id`

### Metas

`POST /api/pessoal/metas`

Body:

```json
{
  "categoria": "Alimentacao",
  "valorMeta": 800,
  "mes": 3,
  "ano": 2026
}
```

Rotas complementares:

- `PUT /api/pessoal/metas/:id`
- `DELETE /api/pessoal/metas/:id`

## Moradores

### `DELETE /api/moradores/:id`

Remove um morador da casa atual.

### `PATCH /api/moradores/:id/admin`

Transfere a administracao da casa.

## Convite

### `GET /api/casa/convite`

Retorna o codigo de convite atual.

### `PATCH /api/casa/convite`

Rotaciona o codigo de convite.

## Operacional

### `GET /api/health`

Healthcheck publico.
