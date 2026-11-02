const bcrypt = require('bcrypt');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const { signToken } = require('../utils/token');
const userModel = require('../models/user.model');

const MYSQL_DUPLICATE_CODE = 'ER_DUP_ENTRY';
const DUMMY_HASH = bcrypt.hashSync('timing-attack-protection', env.bcryptSaltRounds);

const hashPassword = (password) => bcrypt.hash(password, env.bcryptSaltRounds);

const rethrowDuplicateEmail = (err) => {
  if (err.code === MYSQL_DUPLICATE_CODE) {
    throw ApiError.conflict('Email is already registered');
  }
  throw err;
};

const register = async ({ name, email, password }) => {
  const existing = await userModel.findByEmail(email);

  if (existing) {
    throw ApiError.conflict('Email is already registered');
  }

  const passwordHash = await hashPassword(password);

  try {
    const user = await userModel.create({ name, email, passwordHash });
    return { user, token: signToken(user.id) };
  } catch (err) {
    return rethrowDuplicateEmail(err);
  }
};

const login = async ({ email, password }) => {
  const record = await userModel.findByEmail(email);
  const isValid = await bcrypt.compare(password, record ? record.passwordHash : DUMMY_HASH);

  if (!record || !isValid) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const { passwordHash, ...user } = record;
  return { user, token: signToken(user.id) };
};

const updateProfile = async (userId, { name, email, password, currentPassword }) => {
  const changes = {};

  if (name !== undefined) {
    changes.name = name;
  }

  if (email !== undefined) {
    const existing = await userModel.findByEmail(email);

    if (existing && existing.id !== userId) {
      throw ApiError.conflict('Email is already registered');
    }

    changes.email = email;
  }

  if (password !== undefined) {
    const record = await userModel.findByIdWithPassword(userId);
    const isValid = await bcrypt.compare(currentPassword, record.passwordHash);

    if (!isValid) {
      throw ApiError.badRequest('Current password is incorrect', [
        { field: 'currentPassword', message: 'currentPassword is incorrect' },
      ]);
    }

    changes.passwordHash = await hashPassword(password);
  }

  try {
    return await userModel.update(userId, changes);
  } catch (err) {
    return rethrowDuplicateEmail(err);
  }
};

module.exports = { register, login, updateProfile };
