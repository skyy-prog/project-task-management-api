const jwt = require('jsonwebtoken');
const env = require('../config/env');

const ALGORITHM = 'HS256';

const signToken = (userId) =>
  jwt.sign({}, env.jwt.secret, {
    subject: String(userId),
    expiresIn: env.jwt.expiresIn,
    algorithm: ALGORITHM,
  });

const verifyToken = (token) => jwt.verify(token, env.jwt.secret, { algorithms: [ALGORITHM] });

module.exports = { signToken, verifyToken };
