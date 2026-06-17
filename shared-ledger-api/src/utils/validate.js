const Joi = require('joi');
const { AppError } = require('../middleware/error.js');

function validate(schema, property = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');
      return next(new AppError(errorMessage, 400, 'VALIDATION_ERROR'));
    }

    req[property] = value;
    next();
  };
}

function validateBody(schema) {
  return validate(schema, 'body');
}

function validateQuery(schema) {
  return validate(schema, 'query');
}

function validateParams(schema) {
  return validate(schema, 'params');
}

const schemas = {
  object: () => Joi.object(),
  string: () => Joi.string(),
  number: () => Joi.number(),
  boolean: () => Joi.boolean(),
  array: () => Joi.array(),
  date: () => Joi.date(),
  email: () => Joi.string().email(),
  phone: () => Joi.string().pattern(/^1[3-9]\d{9}$/),
  password: () => Joi.string().min(6).max(20),
  objectId: () => Joi.string().pattern(/^[a-fA-F0-9]{24}$/),
  invitationCode: () => Joi.string().length(6).alphanum()
};

module.exports = {
  validate,
  validateBody,
  validateQuery,
  validateParams,
  schemas
};
