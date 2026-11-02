const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const taskService = require('../services/task.service');

const create = asyncHandler(async (req, res) => {
  const task = await taskService.create(req.user.id, req.validated.body);

  sendSuccess(res, {
    statusCode: 201,
    message: 'Task created successfully',
    data: { task },
  });
});

const list = asyncHandler(async (req, res) => {
  const { tasks, pagination } = await taskService.list(req.user.id, req.validated.query);

  sendSuccess(res, {
    message: 'Tasks fetched successfully',
    data: { tasks },
    pagination,
  });
});

const getById = asyncHandler(async (req, res) => {
  const task = await taskService.getById(req.user.id, req.validated.params.id);

  sendSuccess(res, {
    message: 'Task fetched successfully',
    data: { task },
  });
});

const update = asyncHandler(async (req, res) => {
  const task = await taskService.update(req.user.id, req.validated.params.id, req.validated.body);

  sendSuccess(res, {
    message: 'Task updated successfully',
    data: { task },
  });
});

const remove = asyncHandler(async (req, res) => {
  await taskService.remove(req.user.id, req.validated.params.id);

  sendSuccess(res, {
    message: 'Task deleted successfully',
  });
});

module.exports = { create, list, getById, update, remove };
