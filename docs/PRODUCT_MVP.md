# Product MVP

Este documento descreve o escopo real do produto no estado atual.

## Proposta

FluxoCasa organiza o dinheiro da casa compartilhada sem misturar isso com o financeiro pessoal de cada morador.

## Experiencia Atual

### Painel

O `Painel` e a tela principal e hoje possui tres visoes:

- `Geral`
- `Casa`
- `Pessoal`

Ele concentra:

- saldos principais
- pendencias
- saude financeira
- graficos
- historico recente
- formularios e listas de edicao

### Calendario

Mostra eventos financeiros por data:

- contas da casa
- contas pessoais
- rendas
- gastos

O calendario filtra por:

- `Geral`
- `Casa`
- `Pessoal`

Cada item leva para o registro correto no painel.

### Metas

Tela de acompanhamento por escopo:

- panorama consolidado
- metas pessoais
- saude da casa
- graficos de distribuicao
- waterfall de fluxo

### Configuracoes

Central de configuracao do produto:

- perfil
- configuracoes gerais
- moradores
- codigo de convite
- historico da casa
- saida da casa

## Modulos Funcionais

### Casa

- criacao de casa
- entrada por codigo de convite
- rotacao de codigo
- declaracao de contribuicao
- contas da casa
- recorrencia de contas
- marcar conta como paga
- editar e remover conta
- saude financeira da casa
- ciclo mensal
- auditoria de eventos
- saida da casa
- remocao de morador
- troca de admin

### Pessoal

- criar renda
- renda `prevista` ou `recebida`
- recorrencia de renda
- marcar renda como recebida
- criar conta pessoal
- recorrencia de conta pessoal
- marcar conta como paga
- registrar gasto
- metas por categoria
- editar e remover todos esses itens

## Regras de Negocio Relevantes

- um usuario autenticado pode existir sem casa
- usuario sem casa vai para onboarding
- usuario ja vinculado a casa nao pode criar ou entrar em outra casa
- o admin precisa transferir a administracao antes de sair, salvo se estiver sozinho
- urgencia e calculada pelo vencimento
- saude financeira muda conforme saldo projetado e contas urgentes
- renda futura nao entra como recebida por padrao
- itens recorrentes permanecem no fluxo ate serem encerrados

## Recorrencia Atual

Suportada em contas e rendas:

- `UNICA`
- `MENSAL`
- `PARCELADA`
- `FIXA`

## Fora do Escopo Atual

- multiplas casas por usuario
- importacao bancaria
- exportacao CSV/Excel
- notificacoes push
- cobranca automatica
- app mobile nativo

## Objetivo de Uso Real

O projeto ja esta organizado para uso real com:

- producao publicada
- login Google em ambiente configurado
- banco PostgreSQL / Supabase
- testes automatizados
- fluxos principais cobrindo casa e pessoal
