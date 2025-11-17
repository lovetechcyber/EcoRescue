const Joi = require('joi');

const registerSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).required(),
  phone: Joi.string().min(7).max(20).required(),
  email: Joi.string().email().optional().allow(null, ''),
  password: Joi.string().min(8).max(128).required()
});

const loginSchema = Joi.object({
  phoneOrEmail: Joi.string().required(),
  password: Joi.string().required()
});

module.exports = { registerSchema, loginSchema };
