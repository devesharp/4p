import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Configuração do banco de dados
const dbConfig = {
  host: process.env.DB_HOST || 'mysql',
  user: process.env.DB_USER || 'root',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
  password: process.env.DB_PASSWORD || '8fG#2kL2!qR@9zXw',
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
        data LONGTEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Criar a tabela de configurações se não existir
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        wallet_address VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(255) NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Verificar se já existem registros na tabela config
    const [contactsRows] = await pool.execute('SELECT COUNT(*) as contacts FROM contacts');
    
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
      console.log(params);
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

export async function updateStatus(transactionId: string, status: string, data: string = "") {
  const sql = `
    UPDATE transactions 
    SET status = ?, data = ?
    WHERE transaction_id = ?
  `;
  try {
    const [result] = await pool.execute(sql, [status, data, transactionId]);
    // @ts-ignore
    return result.affectedRows;
  } catch (error) {
    console.error('Erro ao atualizar status da transação:', error);
    throw error;
  }
}

// Função para buscar uma transação pelo ID
export async function getTransactionById(id: string) {
  try {
    const [rows] = await pool.execute('SELECT * FROM transactions WHERE transaction_id = ?', [id]);
    // @ts-ignore
    return rows[0];
  } catch (error) {
    console.error('Erro ao buscar transação:', error);
    throw error;
  }
}

// Função para buscar um contato não utilizado
export async function getContact() {
  try {
    const [rows] = await pool.execute('SELECT * FROM contacts WHERE used = FALSE ORDER BY id LIMIT 1');
    
    // Se encontrou um contato, marcar como usado
    if (rows && rows[0]) {
      const contact = rows[0];
      // await pool.execute('UPDATE contacts SET used = TRUE WHERE id = ?', [contact.id]);
      return contact;
    }
    
    // @ts-ignore
    return null;
  } catch (error) {
    console.error('Erro ao buscar contato disponível:', error);
    throw error;
  }
}

// Função para buscar contato existente por CPF ou CNPJ
export async function getContactExist(cpf: string = "", cnpj: string = "") {
  try {
    let query = 'SELECT email, telefone as phone, address as wallet_address FROM transactions WHERE ';
    let params = [];
    
    if (cpf && cpf.trim() !== '') {
      query += 'cpf = ?';
      params.push(cpf);
    } else if (cnpj && cnpj.trim() !== '') {
      query += 'cnpj = ?';
      params.push(cnpj);
    } else {
      return null;
    }
    
    query += ' ORDER BY id DESC LIMIT 1';
    
    const [rows] = await pool.execute(query, params);
    // @ts-ignore
    return rows && rows[0] ? rows[0] : null;
  } catch (error) {
    console.error('Erro ao buscar contato existente:', error);
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