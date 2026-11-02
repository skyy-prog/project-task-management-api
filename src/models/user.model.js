const { pool } = require('../config/mysql');

const PUBLIC_COLUMNS = 'id, name, email, created_at, updated_at';
const UPDATABLE_COLUMNS = Object.freeze({
  name: 'name',
  email: 'email',
  passwordHash: 'password_hash',
});

const toPublic = (row) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toRecord = (row) => ({ ...toPublic(row), passwordHash: row.password_hash });

const findById = async (id) => {
  const [rows] = await pool.execute(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = ? LIMIT 1`, [id]);
  return rows.length ? toPublic(rows[0]) : null;
};

const findByIdWithPassword = async (id) => {
  const [rows] = await pool.execute(
    `SELECT ${PUBLIC_COLUMNS}, password_hash FROM users WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows.length ? toRecord(rows[0]) : null;
};

const findByEmail = async (email) => {
  const [rows] = await pool.execute(
    `SELECT ${PUBLIC_COLUMNS}, password_hash FROM users WHERE email = ? LIMIT 1`,
    [email]
  );
  return rows.length ? toRecord(rows[0]) : null;
};

const create = async ({ name, email, passwordHash }) => {
  const [result] = await pool.execute(
    'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
    [name, email, passwordHash]
  );
  return findById(result.insertId);
};

const update = async (id, fields) => {
  const entries = Object.entries(fields).filter(
    ([key, value]) => Object.hasOwn(UPDATABLE_COLUMNS, key) && value !== undefined
  );

  if (!entries.length) {
    return findById(id);
  }

  const assignments = entries.map(([key]) => `${UPDATABLE_COLUMNS[key]} = ?`).join(', ');
  const values = entries.map(([, value]) => value);

  await pool.execute(`UPDATE users SET ${assignments} WHERE id = ?`, [...values, id]);
  return findById(id);
};

module.exports = { findById, findByIdWithPassword, findByEmail, create, update };
