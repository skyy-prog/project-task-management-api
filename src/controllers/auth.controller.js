const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const authService = require('../services/auth.service');

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.validated.body);

  sendSuccess(res, {
    statusCode: 201,
    message: 'Registration successful',
    data: result,
  });
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.validated.body);

  sendSuccess(res, {
    message: 'Login successful',
    data: result,
  });
});

const me = asyncHandler(async (req, res) => {
  sendSuccess(res, {
    message: 'Profile fetched successfully',
    data: { user: req.user },
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user.id, req.validated.body);

  sendSuccess(res, {
    message: 'Profile updated successfully',
    data: { user },
  });
});

module.exports = { register, login, me, updateProfile };
