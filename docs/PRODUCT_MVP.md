# Product MVP

## Proposta

FluxoCasa organiza finanças de uma casa compartilhada sem perder a visão individual de cada morador.

## Modulos

### Dashboard

- resumo do mês
- saldo da casa
- contas pendentes
- carteira pessoal
- atividade recente

### Casa

- total declarado no mês
- total comprometido no mês
- saldo livre
- contribuições por morador
- contas pendentes e pagas
- ciclo mensal persistido

### Pessoal

- rendas do mês
- contas pessoais
- gastos pessoais
- metas por categoria

### Moradores

- código de convite
- rotação de convite
- moradores ativos
- transferência de admin
- remoção de morador
- histórico auditável da casa

## Regras de negócio principais

- Um usuário autenticado pode existir sem casa.
- Um usuário sem casa vai para onboarding.
- Apenas administradores gerenciam convite e moradores.
- A casa acumula saldo por ciclo mensal.
- O financeiro pessoal não deve alterar o saldo da casa, exceto pela contribuição declarada.

## Fora do escopo atual

- múltiplas casas por usuário
- recorrência de contas
- notificações push ou e-mail
- conciliação bancária
- exportação financeira
