const ApiError = require('../utils/ApiError');

const SOURCES = ['params', 'query', 'body'];

const validate = (schema) => (req, res, next) => {
  const validated = {};
  const errors = [];

  SOURCES.forEach((source) => {
    if (!schema[source]) {
      return;
    }

    const { error, value } = schema[source].validate(req[source] ?? {}, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
      errors: { wrap: { label: false } },
    });

    if (error) {
      error.details.forEach((detail) => {
        errors.push({
          field: detail.path.join('.') || source,
          message: detail.message,
        });
      });
      return;
    }

    validated[source] = value;
  });

  if (errors.length) {
    return next(ApiError.badRequest('Validation failed', errors));
  }

  req.validated = validated;
  return next();
};

module.exports = validate;
