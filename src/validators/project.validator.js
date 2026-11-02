const Joi = require('joi');
const { PROJECT_STATUSES, PAGINATION, MAX_MYSQL_UNSIGNED_INT } = require('../constants');

const idParams = Joi.object({
  id: Joi.number().integer().min(1).max(MAX_MYSQL_UNSIGNED_INT).required(),
});

const name = Joi.string().trim().min(2).max(150);
const description = Joi.string().trim().max(2000).allow('', null);
const status = Joi.string().valid(...PROJECT_STATUSES);

const create = {
  body: Joi.object({
    name: name.required(),
    description,
    status: status.default('active'),
  }),
};

const list = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(PAGINATION.DEFAULT_PAGE),
    limit: Joi.number().integer().min(1).max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
    status,
    search: Joi.string().trim().max(100),
  }),
};

const getById = { params: idParams };

const update = {
  params: idParams,
  body: Joi.object({
    name,
    description,
    status,
  })
    .min(1)
    .messages({ 'object.min': 'At least one field must be provided' }),
};

const remove = { params: idParams };

module.exports = { create, list, getById, update, remove };
