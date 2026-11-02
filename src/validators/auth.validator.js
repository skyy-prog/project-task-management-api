const Joi = require('joi');

const name = Joi.string().trim().min(2).max(100);
const email = Joi.string().trim().lowercase().email().max(255);
const password = Joi.string()
  .min(8)
  .max(72)
  .pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)
  .messages({ 'string.pattern.base': 'password must contain at least one letter and one number' });

const register = {
  body: Joi.object({
    name: name.required(),
    email: email.required(),
    password: password.required(),
  }),
};

const login = {
  body: Joi.object({
    email: email.required(),
    password: Joi.string().required(),
  }),
};

const updateProfile = {
  body: Joi.object({
    name,
    email,
    password,
    currentPassword: Joi.string(),
  })
    .min(1)
    .with('password', 'currentPassword')
    .messages({ 'object.min': 'At least one field must be provided' }),
};

module.exports = { register, login, updateProfile };
