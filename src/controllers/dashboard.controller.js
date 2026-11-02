const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const dashboardService = require('../services/dashboard.service');

const getStats = asyncHandler(async (req, res) => {
  const stats = await dashboardService.getStats(req.user.id);

  sendSuccess(res, {
    message: 'Dashboard statistics fetched successfully',
    data: stats,
  });
});

module.exports = { getStats };
