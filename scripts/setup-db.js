const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const env = require('../src/config/env');

const SCHEMA_PATH = path.join(__dirname, '..', 'database', 'schema.sql');

const run = async () => {
  const connection = await mysql.createConnection({
    host: env.mysql.host,
    port: env.mysql.port,
    user: env.mysql.user,
    password: env.mysql.password,
    multipleStatements: true,
  });

  try {
    const database = mysql.escapeId(env.mysql.database);

    await connection.query(
      `CREATE DATABASE IF NOT EXISTS ${database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await connection.query(`USE ${database}`);
    await connection.query(fs.readFileSync(SCHEMA_PATH, 'utf8'));

    console.log(`MySQL database "${env.mysql.database}" is ready`);
  } finally {
    await connection.end();
  }
};

run().catch((err) => {
  console.error('Database setup failed:', err.message);
  process.exit(1);
});
