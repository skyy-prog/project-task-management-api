const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const authValidator = require('../validators/auth.validator');
const validate = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rateLimit.middleware');

const router = Router();

router.post('/register', authLimiter, validate(authValidator.register), authController.register);
router.post('/login', authLimiter, validate(authValidator.login), authController.login);
router.get('/me', authenticate, authController.me);
router.put(
  '/profile',
  authenticate,
  validate(authValidator.updateProfile),
  authController.updateProfile
);

module.exports = router;
