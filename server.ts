import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import {
  criarTransacao4p,
  FormularioData,
  TransactionResult,
} from "./functions";
import {
  initializeDatabase,
  saveTransaction,
  getTransactionById,
  getContact,
  getContactExist,
  generateUniqueHash,
  updateStatus
} from "./database";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para processar JSON
app.use(express.json());
app.use(cors());
// Inicializar o banco de dados
initializeDatabase().catch(console.error);

// Rota principal
app.get("/", (req, res) => {
  res.json({ message: "API de Pagamentos P4 Finance" });
});

// Rota para solicitar transação PIX
app.post("/pix", async (req, res) => {
  try {
    const dadosRequest = req.body;

    // Validação específica baseada no tipo de pessoa
    if (dadosRequest.tipoPessoa === 'PF') {
      if (!dadosRequest.cpf) {
        return res
          .status(400)
          .json({ error: "CPF é obrigatório para Pessoa Física" });
      }
    } else if (dadosRequest.tipoPessoa === 'PJ') {
      if (!dadosRequest.cnpj) {
        return res
          .status(400)
          .json({ error: "CNPJ é obrigatório para Pessoa Jurídica" });
      }
    } else {
      return res
        .status(400)
        .json({ error: "Tipo de pessoa deve ser 'PF' ou 'PJ'" });
    }

    // Verificar se já existe um contato associado a esse cpf/cnpj
    let contact;
    if (dadosRequest.tipoPessoa === 'PF' && dadosRequest.cpf) {
      contact = await getContactExist(dadosRequest.cpf, "");
    } else if (dadosRequest.tipoPessoa === 'PJ' && dadosRequest.cnpj) {
      contact = await getContactExist("", dadosRequest.cnpj);
    }

    // Se não encontrou contato existente, buscar um novo contato não utilizado
    if (!contact) {
      contact = await getContact();
      if (!contact) {
        return res
          .status(500)
          .json({ error: "Não há contatos disponíveis no sistema" });
      }
    }

    // Preparar dados do formulário usando os dados do contato
    const dados: FormularioData = {
      ...dadosRequest,
      email: contact.email,
      telefone: contact.phone,
      address: contact.wallet_address
    };

    // Validação dos outros campos obrigatórios
    if (!dados.nomeCompleto || !dados.valor) {
      return res
        .status(400)
        .json({ error: "Nome completo e valor são campos obrigatórios" });
    }

    console.log("Iniciando processamento de transação PIX:", dados);

    // Chamar a função de preenchimento de formulário
    const resultado: TransactionResult = await new Promise(async (resolve, reject) => {
      criarTransacao4p(dados, (data) => {
        resolve(data);
      }, (transactionId, status) => {
        console.log("Atualizando status da transação:", transactionId, status, JSON.stringify(dados));
        updateStatus(transactionId, status, JSON.stringify(dados));
      });
    });

    if (
      !resultado.payloadPix ||
      !resultado.transactionId ||
      !resultado.transactionRid
    ) {
      return res
        .status(500)
        .json({ error: "Não foi possível completar a transação" });
    }

    // Gerar hash único para a transação
    const hash = generateUniqueHash();

    // Salvar os dados da transação no banco de dados
    const dadosCompletos = {
      ...dados,
      ...resultado,
      hash,
      status: 'pending'
    };

    console.log({
      transactionId: dadosCompletos.transactionId,
      transactionRid: dadosCompletos.transactionRid,
      payloadPix: dadosCompletos.payloadPix,
      status: dadosCompletos.status,
      explorerUrl: '',
      hash: hash,
      email: dadosCompletos.email,
      telefone: dadosCompletos.telefone,
      cpf: dadosCompletos.cpf || '',
      cnpj: dadosCompletos.cnpj || '',
      tipo_pessoa: dadosCompletos.tipoPessoa,
      nomeCompleto: dadosCompletos.nomeCompleto,
      valor: dadosCompletos.valor,
      address: dadosCompletos.address
    });
    
    const transactionId = await saveTransaction({
      transactionId: dadosCompletos.transactionId,
      transactionRid: dadosCompletos.transactionRid,
      payloadPix: dadosCompletos.payloadPix,
      status: dadosCompletos.status,
      explorerUrl: '',
      hash: hash,
      email: dadosCompletos.email,
      telefone: dadosCompletos.telefone,
      cpf: dadosCompletos.cpf || '',
      cnpj: dadosCompletos.cnpj || '',
      tipo_pessoa: dadosCompletos.tipoPessoa,
      nomeCompleto: dadosCompletos.nomeCompleto,
      valor: dadosCompletos.valor,
      address: dadosCompletos.address
    });

    // Retornar os dados da transação
    return res.status(201).json({
      id: transactionId,
      hash: hash,
      ...resultado,
    });
  } catch (error) {
    console.error("Erro ao processar solicitação PIX:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Rota para buscar uma transação pelo ID
app.get("/pagamento/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const transaction = await getTransactionById(id);

    if (!transaction) {
      return res.status(404).json({ error: "Transação não encontrada" });
    }

    return res.json(transaction);
  } catch (error) {
    console.error("Erro ao buscar transação:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
