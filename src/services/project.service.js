const ApiError = require('../utils/ApiError');
const { getOffset, buildPagination } = require('../utils/pagination');
const projectModel = require('../models/project.model');
const Task = require('../models/task.model');

const getOwnedProject = async (userId, projectId) => {
  const project = await projectModel.findByIdAndUser(projectId, userId);

  if (!project) {
    throw ApiError.notFound('Project not found');
  }

  return project;
};

const create = (userId, payload) => projectModel.create({ userId, ...payload });

const list = async (userId, { page, limit, status, search }) => {
  const { rows, total } = await projectModel.findAllByUser({
    userId,
    status,
    search,
    limit,
    offset: getOffset(page, limit),
  });

  return { projects: rows, pagination: buildPagination({ total, page, limit }) };
};

const update = async (userId, projectId, changes) => {
  await getOwnedProject(userId, projectId);
  return projectModel.update(projectId, userId, changes);
};

const remove = async (userId, projectId) => {
  await getOwnedProject(userId, projectId);
  await projectModel.remove(projectId, userId);

  const { deletedCount } = await Task.deleteMany({ userId, projectId });

  return { deletedTasks: deletedCount };
};

module.exports = { getOwnedProject, create, list, update, remove };
