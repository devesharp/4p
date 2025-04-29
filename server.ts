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
  getConfig,
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

    // Obter configurações do sistema
    const config = await getConfig();
    if (!config) {
      return res
        .status(500)
        .json({ error: "Configurações do sistema não encontradas" });
    }

    // Preparar dados do formulário usando os dados da configuração
    const dados: FormularioData = {
      ...dadosRequest,
      email: config.email,
      telefone: config.phone,
      address: config.wallet_address
    };

    // Validação específica baseada no tipo de pessoa
    if (dados.tipoPessoa === 'PF') {
      if (!dados.cpf) {
        return res
          .status(400)
          .json({ error: "CPF é obrigatório para Pessoa Física" });
      }
    } else if (dados.tipoPessoa === 'PJ') {
      if (!dados.cnpj) {
        return res
          .status(400)
          .json({ error: "CNPJ é obrigatório para Pessoa Jurídica" });
      }
    } else {
      return res
        .status(400)
        .json({ error: "Tipo de pessoa deve ser 'PF' ou 'PJ'" });
    }

    // Validação dos outros campos obrigatórios
    if (!dados.nomeCompleto || !dados.valor) {
      return res
        .status(400)
        .json({ error: "Nome completo e valor são campos obrigatórios" });
    }

    console.log("Iniciando processamento de transação PIX:", dados);

    return res.status(201).json({
      "id": 9,
      "hash": "2849651775031126429",
      "payloadPix": "00020101021226900014br.gov.bcb.pix2568qr.cornerpix.com.br/11581339/v2/3653d8e1-a125-436e-86e0-c2f5b7f8bf8f5204000053039865802BR5914BMP MONEY PLUS6009SAO PAULO62070503***63042A35",
      "transactionId": "5a628e687ed08591b18c92a117021354",
      "transactionRid": "03AFcWeA4ApiISda2SgXnW4tWJsJuOWucDVklEkzJZPS-rF_T58oqfdRJcWsZbELLes7ckkFzWoq_n59yNB83rpRm-KBqCiOboMCeUAQTpnRwy8QdTJf_EEI2Ec1MfN9J8JVKNZhlVhRHxM3ziEG8hp7JOFLEk-pxQWsocgLZrOYcqtWOen1gu4e0aBUxqK27Ayo7IWwz01_wI_ju5GsYKJcSEU4p5O5tdjLoCLBi5i3-tUKtpTBVpKk9-Cn7hYNZ1hPnjbfnTVqRIFvEM-QRAGOIr6L_bQkRjlJtz9GD5JxIUz-L9WbKcVcwuR-7Pm1PSeuBsvw-TGJ22cxzm9NoEnC9CsxDGRt-T2SDNnZsaETQTr5q3MekNtGIJ_yLNcRwrAS8LTLjWmitiy6OK-6I1yBayfelvIuJ3uQTEuyFXtVDHMUXzVHhvZ7xpbSG2jH3YKv0MunA2UUD2rjHohQ12mVTIKFSWaS0GtA0mlLKJ2C0d2zpXD90PpG8Nu17mUaJM98_pbxif2aSjwT1T4GSf5JZP_2f5Gi7FcL-akD_DK44FKFdvz90xv86LgM8jTqOr7pwZja3Jn7QiqCfboZNINlGQKRlDbO0P9NcIefHkgPTjkNCJCLBskE8pUvtsdvJ7l0EaP_wzCR069q0b16MXDAE3ClgcXmysmnMuGMAN-hLm8G8oWXfO6G5Zh4RukS-PbesKSxdKyf9dAT1EiBJ3YoYpIK86GAr-4th4MdCMRs7GDzZEUIla-zKmZWHJJ7ISYoi6Kn_MLAbATw4E8NIaRmTx9ijGKlm4Uumsyj_TVvfD5sLrgZz9QYPj409U-Zj4eJugbADJ6NYuC5SYEnZP69GqHzEsFDGeKtcBlbFuCtJ5fQwc79V8hq-juJRZt-mTSeUFYNbZTogMYumzKYkmlrQ1Scoj4SG0sHnCPjg9AXZbETMqomjI67k",
      "status": ""
    });
    
    // Chamar a função de preenchimento de formulário
    const resultado: TransactionResult = await new Promise(async (resolve, reject) => {
      criarTransacao4p(dados, (data) => {
        resolve(data);
      }, (transactionId, status) => {
        console.log("Atualizando status da transação:", transactionId, status);
        updateStatus(transactionId, status);
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
