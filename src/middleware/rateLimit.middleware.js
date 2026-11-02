const rateLimit = require('express-rate-limit');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const createLimiter = (limit) =>
  rateLimit({
    windowMs: env.rateLimit.windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (req, res, next) => next(ApiError.tooManyRequests()),
  });

const apiLimiter = createLimiter(env.rateLimit.max);
const authLimiter = createLimiter(env.rateLimit.authMax);

module.exports = { apiLimiter, authLimiter };
