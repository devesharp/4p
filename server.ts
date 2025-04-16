import express from 'express';
import dotenv from 'dotenv';
import { criarTransacao4p, FormularioData, TransactionResult } from './functions';
import { initializeDatabase, saveTransaction, getTransactionById } from './database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para processar JSON
app.use(express.json());

// Inicializar o banco de dados
initializeDatabase().catch(console.error);

// Rota principal
app.get('/', (req, res) => {
  res.json({ message: 'API de Pagamentos P4 Finance' });
});

// Rota para solicitar transação PIX
app.post('/pix', async (req, res) => {
  try {
    const dados: FormularioData = req.body;
    
    // Validação básica dos dados
    if (!dados.email || !dados.telefone || !dados.cpf || !dados.nomeCompleto || !dados.valor || !dados.address) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }
    
    console.log('Iniciando processamento de transação PIX:', dados);
    
    // Chamar a função de preenchimento de formulário
    const resultado: TransactionResult = await criarTransacao4p(dados);
    
    if (!resultado.payloadPix || !resultado.transactionId || !resultado.transactionRid) {
      return res.status(500).json({ error: 'Não foi possível completar a transação' });
    }
    
    // Salvar os dados da transação no banco de dados
    const dadosCompletos = {
      ...dados,
      ...resultado
    };
    
    const transactionId = await saveTransaction(dadosCompletos);
    
    // Retornar os dados da transação
    return res.status(201).json({
      id: transactionId,
      ...resultado
    });
  } catch (error) {
    console.error('Erro ao processar solicitação PIX:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para buscar uma transação pelo ID
app.get('/pagamento/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    const transaction = await getTransactionById(id);
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }
    
    return res.json(transaction);
  } catch (error) {
    console.error('Erro ao buscar transação:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
}); 