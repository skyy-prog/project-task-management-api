const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const projectService = require('../services/project.service');

const create = asyncHandler(async (req, res) => {
  const project = await projectService.create(req.user.id, req.validated.body);

  sendSuccess(res, {
    statusCode: 201,
    message: 'Project created successfully',
    data: { project },
  });
});

const list = asyncHandler(async (req, res) => {
  const { projects, pagination } = await projectService.list(req.user.id, req.validated.query);

  sendSuccess(res, {
    message: 'Projects fetched successfully',
    data: { projects },
    pagination,
  });
});

const getById = asyncHandler(async (req, res) => {
  const project = await projectService.getOwnedProject(req.user.id, req.validated.params.id);

  sendSuccess(res, {
    message: 'Project fetched successfully',
    data: { project },
  });
});

const update = asyncHandler(async (req, res) => {
  const project = await projectService.update(
    req.user.id,
    req.validated.params.id,
    req.validated.body
  );

  sendSuccess(res, {
    message: 'Project updated successfully',
    data: { project },
  });
});

const remove = asyncHandler(async (req, res) => {
  const result = await projectService.remove(req.user.id, req.validated.params.id);

  sendSuccess(res, {
    message: 'Project deleted successfully',
    data: result,
  });
});

module.exports = { create, list, getById, update, remove };
