const Joi = require('joi');

const createReportSchema = Joi.object({
  type: Joi.string().valid('flood','waste','blocked_drain','other').required(),
  description: Joi.string().max(2000).allow('', null),
  lng: Joi.number().required(),
  lat: Joi.number().required(),
  severity: Joi.string().valid('low','medium','high').optional(),
  metadata: Joi.object().optional()
});

module.exports = { createReportSchema };
