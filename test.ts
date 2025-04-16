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
    email: 'albertoammar2@gmail.com',
    telefone: '11987654322',
    cpf: '41056294841',
    nomeCompleto: 'Alberto Walid Ammar',
    valor: 301.20,
    address: '0x3d7c48a62e9705ab57fd2b4c54ab1296893f1828',
  })
  console.log(b);
});