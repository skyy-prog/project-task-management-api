const mysql = require('mysql2/promise');
const env = require('./env');

const pool = mysql.createPool({
  host: env.mysql.host,
  port: env.mysql.port,
  user: env.mysql.user,
  password: env.mysql.password,
  database: env.mysql.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: 'Z',
});

const connectMySQL = async () => {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
  } finally {
    connection.release();
  }
  console.log(`MySQL connected: ${env.mysql.host}:${env.mysql.port}/${env.mysql.database}`);
};

const closeMySQL = () => pool.end();

module.exports = { pool, connectMySQL, closeMySQL };
