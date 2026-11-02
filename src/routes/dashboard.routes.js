const { Router } = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = Router();

router.get('/', authenticate, dashboardController.getStats);

module.exports = router;
