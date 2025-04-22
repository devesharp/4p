import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Configuração do banco de dados
const dbConfig = {
  host: process.env.DB_HOST || 'mysql',
  user: process.env.DB_USER || 'root',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
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
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        transaction_id VARCHAR(255),
        transaction_rid VARCHAR(255),
        payload_pix TEXT,
        status VARCHAR(50),
        explorer_url TEXT,
        hash VARCHAR(255),
        email VARCHAR(255),
        telefone VARCHAR(20),
        cpf VARCHAR(14),
        cnpj VARCHAR(20),
        tipo_pessoa VARCHAR(2),
        nome_completo VARCHAR(255),
        valor VARCHAR(50),
        address VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Criar a tabela de configurações se não existir
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS config (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        wallet_address VARCHAR(255) NOT NULL,
        phone VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Verificar se já existem registros na tabela config
    const [configRows] = await pool.execute('SELECT COUNT(*) as count FROM config');
    
    console.log('Banco de dados inicializado com sucesso!');
  } catch (error) {
    console.error('Erro ao inicializar o banco de dados:', error);
    throw error;
  }
}

// Função para salvar uma transação no banco de dados
export async function saveTransaction(data: any) {
  // Preparando instrução parametrizada para proteger contra SQL Injection
  const sql = `
    INSERT INTO transactions 
    (transaction_id, transaction_rid, payload_pix, status, explorer_url, hash, email, telefone, cpf, cnpj, tipo_pessoa, nome_completo, valor, address) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  try {
    // Obtém uma conexão do pool
    const conn = await pool.getConnection();
    try {
      const params = [
        data.transactionId,
        data.transactionRid,
        data.payloadPix,
        data.status || '',
        data.explorerUrl || '',
        data.hash || '',
        data.email,
        data.telefone,
        data.cpf || '',
        data.cnpj || '',
        data.tipo_pessoa || '',
        data.nomeCompleto,
        data.valor,
        data.address
      ];
      // Executa a query parametrizada
      const [result] = await conn.execute(sql, params);
      // @ts-ignore
      return result.insertId;
    } finally {
      // Garante liberação da conexão
      conn.release();
    }
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

// Função para buscar a configuração do sistema
export async function getConfig() {
  try {
    const [rows] = await pool.execute('SELECT * FROM config ORDER BY id LIMIT 1');
    // @ts-ignore
    return rows[0];
  } catch (error) {
    console.error('Erro ao buscar configuração:', error);
    throw error;
  }
}

// Função para gerar um hash único
export function generateUniqueHash(): string {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 1000000);
  return `${timestamp}${random}`.split('').sort(() => Math.random() - 0.5).join('');
}

export default pool; 