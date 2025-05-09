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
initializeDatabase().catch(console.error).then(async () => {
  let b = await criarTransacao4p({
    email: 'lucaspatooliveira@gmail.com',
    telefone: '11992411121',
    cnpj: '69189628098',
    tipoPessoa: 'PJ',
    nomeCompleto: 'Lucas Pato Oliveira',
    valor: 320.00,
    address: '0x3ddfa8ec3052539b6c9549f12cea2c295cff5296',
  }, (data) => {
    console.log(data);
  }, (transactionId, status) => {
    console.log(transactionId, status);
  })
  console.log(b);
});