const mongoose = require('mongoose');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const MYSQL_DUPLICATE_CODE = 'ER_DUP_ENTRY';
const MONGO_DUPLICATE_CODE = 11000;

const isMySQLError = (err) => typeof err.code === 'string' && err.code.startsWith('ER_');

const normalizeError = (err) => {
  if (err instanceof ApiError) {
    return err;
  }

  if (err.type === 'entity.parse.failed') {
    return new ApiError(400, 'Malformed JSON in request body');
  }

  if (err.type === 'entity.too.large') {
    return new ApiError(413, 'Request body is too large');
  }

  if (err.name === 'TokenExpiredError') {
    return ApiError.unauthorized('Authentication token has expired');
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'NotBeforeError') {
    return ApiError.unauthorized('Invalid authentication token');
  }

  if (err instanceof mongoose.Error.CastError) {
    return ApiError.badRequest(`Invalid value for ${err.path}`);
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).map((item) => ({
      field: item.path,
      message: item.message,
    }));
    return ApiError.badRequest('Validation failed', errors);
  }

  if (err.code === MONGO_DUPLICATE_CODE) {
    return ApiError.conflict('Duplicate value detected');
  }

  if (err.code === MYSQL_DUPLICATE_CODE) {
    return ApiError.conflict('Duplicate value detected');
  }

  if (isMySQLError(err) || err.name === 'MongoServerError' || err.name === 'MongoNetworkError') {
    return new ApiError(500, 'A database error occurred');
  }

  return new ApiError(500, 'Internal server error');
};

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const normalized = normalizeError(err);

  if (normalized.statusCode >= 500) {
    console.error(err);
  }

  const body = {
    success: false,
    message: normalized.message,
  };

  if (normalized.errors && normalized.errors.length) {
    body.errors = normalized.errors;
  }

  if (env.nodeEnv === 'development' && normalized.statusCode >= 500) {
    body.stack = err.stack;
  }

  return res.status(normalized.statusCode).json(body);
};

module.exports = errorHandler;
