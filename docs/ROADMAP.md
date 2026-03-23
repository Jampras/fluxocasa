# Roadmap

Este roadmap reflete o estado atual depois da estabilizacao principal do produto.

## Entregue

- autenticacao com Google via Supabase
- fallback local de auth para desenvolvimento
- onboarding de casa
- painel com abas `Geral`, `Casa` e `Pessoal`
- calendario financeiro por escopo
- metas por escopo
- configuracoes centrais
- recorrencia de contas e rendas
- saude financeira calculada
- historico recente com acoes
- gestao de moradores
- auditoria da casa
- cobertura E2E autenticada
- padronizacao do `apiHandler`
- semantica HTTP corrigida nas mutacoes principais

## Proxima leva recomendada

- filtros e busca nas listas de contas, rendas e gastos
- ordenacao por status, vencimento e categoria
- pagina dedicada de auditoria da casa com filtros
- melhoria visual de estados vazios e loading
- refinamento de feedback apos salvar e excluir

## Fase seguinte

- notificacoes de vencimento
- expira de convite
- exportacao de dados
- importacao de dados
- observabilidade com tracing e captura estruturada de erro
- dashboards historicos por periodo maior que o mes atual

## Divida Tecnica Residual

- reduzir ainda mais o custo do dashboard geral em cenarios com volume alto
- ampliar a cobertura de cenarios de borda em recorrencia
- revisar encoding antigo em comentarios e docs legados
- manter a documentacao sincronizada a cada rodada grande
