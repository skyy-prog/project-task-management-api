const PROJECT_STATUSES = Object.freeze(['active', 'completed', 'archived']);
const TASK_STATUSES = Object.freeze(['todo', 'in_progress', 'completed']);
const TASK_PRIORITIES = Object.freeze(['low', 'medium', 'high']);

const PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
});

const MAX_MYSQL_UNSIGNED_INT = 4294967295;

module.exports = {
  PROJECT_STATUSES,
  TASK_STATUSES,
  TASK_PRIORITIES,
  PAGINATION,
  MAX_MYSQL_UNSIGNED_INT,
};
