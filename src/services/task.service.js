const ApiError = require('../utils/ApiError');
const { getOffset, buildPagination } = require('../utils/pagination');
const Task = require('../models/task.model');
const projectService = require('./project.service');

const findOwnedTask = async (userId, taskId) => {
  const task = await Task.findOne({ _id: taskId, userId });

  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  return task;
};

const create = async (userId, payload) => {
  await projectService.getOwnedProject(userId, payload.projectId);
  return Task.create({ ...payload, userId });
};

const list = async (userId, { page, limit, status, priority, projectId }) => {
  const filter = { userId };

  if (status) {
    filter.status = status;
  }

  if (priority) {
    filter.priority = priority;
  }

  if (projectId !== undefined) {
    filter.projectId = projectId;
  }

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(getOffset(page, limit))
      .limit(limit),
    Task.countDocuments(filter),
  ]);

  return { tasks, pagination: buildPagination({ total, page, limit }) };
};

const getById = (userId, taskId) => findOwnedTask(userId, taskId);

const update = async (userId, taskId, changes) => {
  const task = await findOwnedTask(userId, taskId);

  if (changes.projectId !== undefined && changes.projectId !== task.projectId) {
    await projectService.getOwnedProject(userId, changes.projectId);
  }

  task.set(changes);
  return task.save();
};

const remove = async (userId, taskId) => {
  const task = await findOwnedTask(userId, taskId);
  await task.deleteOne();
};

const getStatsByUser = async (userId) => {
  const [stats] = await Task.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        pending: { $sum: { $cond: [{ $ne: ['$status', 'completed'] }, 1, 0] } },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        highPriority: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
      },
    },
  ]);

  return {
    total: stats?.total ?? 0,
    pending: stats?.pending ?? 0,
    completed: stats?.completed ?? 0,
    highPriority: stats?.highPriority ?? 0,
  };
};

module.exports = { create, list, getById, update, remove, getStatsByUser };
