# Product MVP

Este documento descreve o escopo real do produto no estado atual.

## Proposta

FluxoCasa organiza o dinheiro da casa compartilhada sem misturar isso com o financeiro pessoal de cada morador.

## Experiencia Atual

### Painel

O `Painel` e a tela principal e hoje possui uma visao unica com:

- cards-resumo em carrossel
- calendario interativo geral
- historico recente resumido

Ele concentra leitura rapida e contexto do mes, nao a gestao completa dos registros.

### Gerenciar

O trabalho operacional foi concentrado em `Gerenciar`, com duas abas:

- `Casa`
- `Pessoal`

Ali ficam:

- formularios de criacao
- edicao detalhada
- historicos equivalentes por dominio
- manutencao das listas
- gestao cotidiana do fluxo

### Anotacoes

Tela de mural unico:

- notas pessoais privadas
- notas pessoais publicas
- notas da casa
- filtros por busca, tag, visibilidade e escopo
- reorder manual
- atualizacao automatica do mural

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
- historico da casa dentro de `Gerenciar > Casa`

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
- historico pessoal dentro de `Gerenciar > Pessoal`
- anotacoes pessoais privadas e publicas dentro do mural

### Anotacoes

- criar nota
- editar nota
- excluir nota
- reordenar notas
- sincronizar mural em tempo real
- distinguir nota privada, publica e da casa

## Regras de Negocio Relevantes

- um usuario autenticado pode existir sem casa
- usuario sem casa vai para onboarding
- usuario ja vinculado a casa nao pode criar ou entrar em outra casa
- o admin precisa transferir a administracao antes de sair, salvo se estiver sozinho
- urgencia e calculada pelo vencimento
- saude financeira muda conforme saldo projetado e contas urgentes
- renda futura nao entra como recebida por padrao
- itens recorrentes permanecem no fluxo ate serem encerrados
- o wizard de lancamento e modal global e se adapta ao contexto atual
- o mural de anotacoes respeita visibilidade por backend e por RLS no realtime

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
- navegacao principal estabilizada em `Painel / Gerenciar / Anotacoes / Configuracoes`
