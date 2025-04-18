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
    email: 'albertoammar243521@gmail.com',
    telefone: '11987654355',
    cpf: '03275562509',
    nomeCompleto: 'Julia Romano',
    valor: 302.20,
    address: '0x477DbD3e7C41DebeB7b763361a0034858d007af1',
  })
  console.log(b);
});