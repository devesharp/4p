# P4 Payments API

API para automação de pagamentos via PIX usando o site da 4P Finance.

## Requisitos

- Node.js 18+
- Docker e Docker Compose

## Configuração

1. Clone o repositório:
   ```
   git clone <repository-url>
   cd p4-payments
   ```

2. Instale as dependências:
   ```
   npm install
   ```

3. Configure as variáveis de ambiente:
   Copie o arquivo `.env.example` para `.env` e ajuste as configurações conforme necessário.

## Execução

### Modo Desenvolvimento

Para executar em modo desenvolvimento:

```
npm run dev
```

### Construção e Execução com Docker

Para construir e executar com Docker:

```
docker-compose up -d
```

Isso irá iniciar:
- Um servidor MySQL
- A aplicação Node.js
- Um servidor Nginx como proxy reverso

## Endpoints da API

### POST /pix

Iniciar uma transação PIX.

**Corpo da requisição:**
```json
{
  "email": "exemplo@email.com",
  "telefone": "11999991234",
  "cpf": "12345678900",
  "nomeCompleto": "Nome Completo",
  "valor": "100.00",
  "address": "0x1234567890abcdef1234567890abcdef12345678"
}
```

**Resposta:**
```json
{
  "id": 1,
  "payloadPix": "00020101021226...",
  "transactionId": "123456",
  "transactionRid": "abc123",
  "status": "pending",
  "explorerUrl": "https://explorer.example.com/tx/123456",
  "hash": "0x1234..."
}
```

### GET /pagamento/:id

Obter os detalhes de uma transação pelo ID.

**Resposta:**
```json
{
  "id": 1,
  "transaction_id": "123456",
  "transaction_rid": "abc123",
  "payload_pix": "00020101021226...",
  "status": "completed",
  "explorer_url": "https://explorer.example.com/tx/123456",
  "hash": "0x1234...",
  "email": "exemplo@email.com",
  "telefone": "11999991234",
  "cpf": "12345678900",
  "nome_completo": "Nome Completo",
  "valor": "100.00",
  "address": "0x1234567890abcdef1234567890abcdef12345678",
  "created_at": "2023-01-01T12:00:00Z",
  "updated_at": "2023-01-01T12:05:00Z"
}
```

## Licença

ISC 