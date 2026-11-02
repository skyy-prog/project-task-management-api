const { pool } = require('../config/mysql');

const COLUMNS = 'id, user_id, name, description, status, created_at, updated_at';
const UPDATABLE_COLUMNS = Object.freeze({
  name: 'name',
  description: 'description',
  status: 'status',
});

const toProject = (row) => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  description: row.description,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const escapeLike = (value) => value.replace(/[\\%_]/g, '\\$&');

const findByIdAndUser = async (id, userId) => {
  const [rows] = await pool.execute(
    `SELECT ${COLUMNS} FROM projects WHERE id = ? AND user_id = ? LIMIT 1`,
    [id, userId]
  );
  return rows.length ? toProject(rows[0]) : null;
};

const create = async ({ userId, name, description, status }) => {
  const [result] = await pool.execute(
    'INSERT INTO projects (user_id, name, description, status) VALUES (?, ?, ?, ?)',
    [userId, name, description ?? null, status]
  );
  return findByIdAndUser(result.insertId, userId);
};

const findAllByUser = async ({ userId, status, search, limit, offset }) => {
  const conditions = ['user_id = ?'];
  const params = [userId];

  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }

  if (search) {
    const term = `%${escapeLike(search)}%`;
    conditions.push('(name LIKE ? OR description LIKE ?)');
    params.push(term, term);
  }

  const where = conditions.join(' AND ');

  const [[rows], [[{ total }]]] = await Promise.all([
    pool.query(
      `SELECT ${COLUMNS} FROM projects WHERE ${where} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    ),
    pool.query(`SELECT COUNT(*) AS total FROM projects WHERE ${where}`, params),
  ]);

  return { rows: rows.map(toProject), total: Number(total) };
};

const update = async (id, userId, fields) => {
  const entries = Object.entries(fields).filter(
    ([key, value]) => Object.hasOwn(UPDATABLE_COLUMNS, key) && value !== undefined
  );

  if (!entries.length) {
    return findByIdAndUser(id, userId);
  }

  const assignments = entries.map(([key]) => `${UPDATABLE_COLUMNS[key]} = ?`).join(', ');
  const values = entries.map(([, value]) => value);

  await pool.execute(`UPDATE projects SET ${assignments} WHERE id = ? AND user_id = ?`, [
    ...values,
    id,
    userId,
  ]);
  return findByIdAndUser(id, userId);
};

const remove = async (id, userId) => {
  const [result] = await pool.execute('DELETE FROM projects WHERE id = ? AND user_id = ?', [id, userId]);
  return result.affectedRows > 0;
};

const getStatsByUser = async (userId) => {
  const [rows] = await pool.execute(
    `SELECT
       COUNT(*) AS total,
       COALESCE(SUM(status = 'active'), 0) AS active,
       COALESCE(SUM(status = 'completed'), 0) AS completed
     FROM projects
     WHERE user_id = ?`,
    [userId]
  );

  const stats = rows[0];

  return {
    total: Number(stats.total),
    active: Number(stats.active),
    completed: Number(stats.completed),
  };
};

module.exports = { findByIdAndUser, create, findAllByUser, update, remove, getStatsByUser };
