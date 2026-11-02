const { Router } = require('express');
const projectController = require('../controllers/project.controller');
const projectValidator = require('../validators/project.validator');
const validate = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');

const router = Router();

router.use(authenticate);

router
  .route('/')
  .post(validate(projectValidator.create), projectController.create)
  .get(validate(projectValidator.list), projectController.list);

router
  .route('/:id')
  .get(validate(projectValidator.getById), projectController.getById)
  .put(validate(projectValidator.update), projectController.update)
  .delete(validate(projectValidator.remove), projectController.remove);

module.exports = router;
