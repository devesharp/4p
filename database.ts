import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Configuração do banco de dados
const dbConfig = {
  host: process.env.DB_HOST || 'mysql',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'p4_payments',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Criação do pool de conexões
const pool = mysql.createPool(dbConfig);

// Função para inicializar o banco de dados (tabelas, etc.)
export async function initializeDatabase() {
  try {
    // Criar a tabela de transações se não existir
    // await pool.execute(`
    //   CREATE TABLE IF NOT EXISTS transactions (
    //     id INT AUTO_INCREMENT PRIMARY KEY,
    //     transaction_id VARCHAR(255),
    //     transaction_rid VARCHAR(255),
    //     payload_pix TEXT,
    //     status VARCHAR(50),
    //     explorer_url TEXT,
    //     hash VARCHAR(255),
    //     email VARCHAR(255),
    //     telefone VARCHAR(20),
    //     cpf VARCHAR(14),
    //     nome_completo VARCHAR(255),
    //     valor VARCHAR(50),
    //     address VARCHAR(255),
    //     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    //     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    //   )
    // `);
    
    console.log('Banco de dados inicializado com sucesso!');
  } catch (error) {
    console.error('Erro ao inicializar o banco de dados:', error);
    throw error;
  }
}

// Função para salvar uma transação no banco de dados
export async function saveTransaction(data: any) {
  try {
    const [result] = await pool.execute(`
      INSERT INTO transactions 
      (transaction_id, transaction_rid, payload_pix, status, explorer_url, hash, email, telefone, cpf, nome_completo, valor, address) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.transactionId,
      data.transactionRid,
      data.payloadPix,
      data.status || '',
      data.explorerUrl || '',
      data.hash || '',
      data.email,
      data.telefone,
      data.cpf,
      data.nomeCompleto,
      data.valor,
      data.address
    ]);
    
    // @ts-ignore
    return result.insertId;
  } catch (error) {
    console.error('Erro ao salvar transação:', error);
    throw error;
  }
}

// Função para buscar uma transação pelo ID
export async function getTransactionById(id: number) {
  try {
    const [rows] = await pool.execute('SELECT * FROM transactions WHERE id = ?', [id]);
    // @ts-ignore
    return rows[0];
  } catch (error) {
    console.error('Erro ao buscar transação:', error);
    throw error;
  }
}

export default pool; 