const Joi = require('joi');
const {
  TASK_STATUSES,
  TASK_PRIORITIES,
  PAGINATION,
  MAX_MYSQL_UNSIGNED_INT,
} = require('../constants');

const idParams = Joi.object({
  id: Joi.string()
    .hex()
    .length(24)
    .required()
    .messages({
      'string.hex': 'id must be a valid task id',
      'string.length': 'id must be a valid task id',
    }),
});

const title = Joi.string().trim().min(1).max(200);
const description = Joi.string().trim().max(2000).allow('');
const status = Joi.string().valid(...TASK_STATUSES);
const priority = Joi.string().valid(...TASK_PRIORITIES);
const projectId = Joi.number().integer().min(1).max(MAX_MYSQL_UNSIGNED_INT);
const dueDate = Joi.date().iso().allow(null);

const create = {
  body: Joi.object({
    title: title.required(),
    description,
    status: status.default('todo'),
    priority: priority.default('medium'),
    projectId: projectId.required(),
    dueDate,
  }),
};

const list = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(PAGINATION.DEFAULT_PAGE),
    limit: Joi.number().integer().min(1).max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
    status,
    priority,
    projectId,
  }),
};

const getById = { params: idParams };

const update = {
  params: idParams,
  body: Joi.object({
    title,
    description,
    status,
    priority,
    projectId,
    dueDate,
  })
    .min(1)
    .messages({ 'object.min': 'At least one field must be provided' }),
};

const remove = { params: idParams };

module.exports = { create, list, getById, update, remove };
