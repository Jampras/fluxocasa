# Roadmap

Este roadmap reflete o estado atual depois da estabilizacao principal do produto.

## Entregue

- autenticacao com Google via Supabase
- fallback local de auth para desenvolvimento
- onboarding de casa
- painel com cards em carrossel, calendario interativo e historico resumido
- gerenciar com abas `Casa` e `Pessoal`
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
- revalidacao granular das views
- prefetch e loading para troca de guias
- wizard mobile refinado com ocultacao da navbar inferior

## Proxima leva recomendada

- reduzir o custo de dados em `Metas`, principalmente no escopo `Geral`
- adicionar filtros e busca nas listas de contas, rendas e gastos
- adicionar ordenacao por status, vencimento e categoria
- refinar estados vazios e skeletons por secao, nao so loading global
- feedback mais explicito depois de salvar, excluir e marcar status
- pagina dedicada de auditoria da casa com filtros

## Fase seguinte

- notificacoes de vencimento
- expira de convite
- exportacao de dados
- importacao de dados
- observabilidade com tracing e captura estruturada de erro
- dashboards historicos por periodo maior que o mes atual

## Divida Tecnica Residual

- reduzir ainda mais o custo do dashboard geral em cenarios com volume alto
- ampliar a cobertura de cenarios de borda em recorrencia e onboarding
- revisar encoding antigo em comentarios e docs legados
- manter a documentacao sincronizada a cada rodada grande
