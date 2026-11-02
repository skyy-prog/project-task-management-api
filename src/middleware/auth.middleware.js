const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { verifyToken } = require('../utils/token');
const userModel = require('../models/user.model');

const authenticate = asyncHandler(async (req, res, next) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    throw ApiError.unauthorized('Authentication token is missing');
  }

  const payload = verifyToken(token);
  const userId = Number(payload.sub);

  if (!Number.isInteger(userId)) {
    throw ApiError.unauthorized('Invalid authentication token');
  }

  const user = await userModel.findById(userId);

  if (!user) {
    throw ApiError.unauthorized('User associated with this token no longer exists');
  }

  req.user = user;
  next();
});

module.exports = { authenticate };
