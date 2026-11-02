const { Router } = require('express');
const taskController = require('../controllers/task.controller');
const taskValidator = require('../validators/task.validator');
const validate = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');

const router = Router();

router.use(authenticate);

router
  .route('/')
  .post(validate(taskValidator.create), taskController.create)
  .get(validate(taskValidator.list), taskController.list);

router
  .route('/:id')
  .get(validate(taskValidator.getById), taskController.getById)
  .put(validate(taskValidator.update), taskController.update)
  .delete(validate(taskValidator.remove), taskController.remove);

module.exports = router;
