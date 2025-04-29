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

## Configuração do PM2

Este projeto utiliza PM2 para gerenciamento de processos em ambiente de produção.

### Comandos disponíveis

- `npm run pm2:start` - Inicia a aplicação com PM2
- `npm run pm2:stop` - Para a aplicação
- `npm run pm2:restart` - Reinicia a aplicação
- `npm run pm2:status` - Verifica o status da aplicação

### Configuração de inicialização automática

Para configurar o PM2 para iniciar automaticamente quando o sistema reiniciar:

1. Execute o comando `npx pm2 startup`
2. Copie e execute o comando sugerido pelo PM2
3. Execute `npx pm2 save` para salvar a configuração atual

### Configuração do PM2

A configuração do PM2 está no arquivo `ecosystem.config.js`. Este arquivo define:

- Nome da aplicação: `p4-payments`
- Comando de execução: Usa o npx para executar ts-node com server.ts
- Reinício automático em caso de falha
- Reinício com delay de 3 segundos após uma falha
- Limite de memória: 1GB (reinicia automaticamente se exceder)
- Configurações para ambientes de desenvolvimento e produção

### Solução de problemas

Se você encontrar erros como `exec "/usr/bin/node" "/usr/bin/yarn" "$@"`, significa que o PM2 não está encontrando os executáveis corretos (Node.js ou Yarn). Para resolver:

1. Execute `which node` e `which npx` para obter os caminhos corretos
2. Atualize o arquivo `ecosystem.config.js` com esses caminhos
3. Use o caminho absoluto para os executáveis no campo `script`
4. Reinicie o PM2 com `npm run pm2:restart`

Exemplo de configuração para NVM:
```js
module.exports = {
  apps: [{
    name: 'p4-payments',
    script: '/caminho/para/seu/npx',
    args: 'ts-node -T server.ts',
    // ... outras configurações
  }]
};
``` 