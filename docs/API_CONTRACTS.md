# 🔌 API Contracts: FluxoCasa

Esta documentação detalha os inputs, outputs e comportamentos das rotas de API do sistema, seguindo o padrão estabelecido pelo `apiHandler`.

## 📦 Padrão de Respostas

Todas as respostas são retornadas em formato JSON, com os seguintes status codes padrão:

| Status | Significado | Quando ocorre |
|--------|-------------|---------------|
| `200`  | **OK** | Sucesso na leitura de dados. |
| `201`  | **Created** | Sucesso em operações de escrita (POST/PUT/PATCH). |
| `400`  | **Bad Request** | Payload inválido, erro de validação Zod ou erro de regra de negócio. |
| `401`  | **Unauthorized** | Sessão expirada ou usuário não autenticado. |
| `403`  | **Forbidden** | Usuário autenticado mas sem permissão para o recurso (ex: Morador alterando outra casa). |
| `500`  | **Server Error** | Erro inesperado no processamento interno. |

---

## 🔐 Autenticação (Auth)

### `POST /api/auth/login`
- **Body**: `{ email, password }`
- **Nota**: Atualmente bloqueado no MVP para forçar login via Google (Supabase).

### `POST /api/auth/logout`
- **Efeito**: Limpa os cookies de sessão e desloga do Supabase.

---

## 🏠 Casa (House)

### `GET /api/casa`
- **Response**: Snapshot completo da casa no mês corrente.
- **Campos**: `id`, `nome`, `contas`, `moradores`, `resumoFinanceiro`.

### `POST /api/casa/contas`
- **Body (Zod Transform)**:
  ```json
  {
    "titulo": "Internet",
    "categoria": "Essenciais",
    "valor": 120.50, // Convertido para valorCentavos internally
    "vencimento": "2024-05-15", // Convertido para Date internally
    "observacao": "Fibra optica"
  }
  ```

---

## 👤 Pessoal (Personal)

### `GET /api/pessoal/contas`
- **Response**: Lista de `weeklyBills` do morador autenticado.

### `POST /api/pessoal/gastos`
- **Body**:
  ```json
  {
    "titulo": "Almoço",
    "categoria": "Alimentação",
    "valor": 45.90,
    "gastoEm": "2024-05-01"
  }
  ```

---

## 👥 Moradores (Residents)

### `DELETE /api/moradores/:id`
- **Permissão**: Apenas `ADMIN` da casa.
- **Ação**: Remove um morador da casa atual.

### `PATCH /api/moradores/:id/admin`
- **Permissão**: Apenas `ADMIN` atual da casa.
- **Ação**: Transfere o cargo de administrador para o morador destino.

---

## 🏥 Saúde (Operational)

### `GET /api/health`
- **Public**: Sim (auth: false).
- **Ação**: Verifica se a instância está respondendo.

---

*Documentação gerada automaticamente baseada nos schemas de validação Zod.*
