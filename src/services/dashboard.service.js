const projectModel = require('../models/project.model');
const taskService = require('./task.service');

const getStats = async (userId) => {
  const [projects, tasks] = await Promise.all([
    projectModel.getStatsByUser(userId),
    taskService.getStatsByUser(userId),
  ]);

  return {
    totalProjects: projects.total,
    activeProjects: projects.active,
    completedProjects: projects.completed,
    totalTasks: tasks.total,
    pendingTasks: tasks.pending,
    completedTasks: tasks.completed,
    highPriorityTasks: tasks.highPriority,
  };
};

module.exports = { getStats };
