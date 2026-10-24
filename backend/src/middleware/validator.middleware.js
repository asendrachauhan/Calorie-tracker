const mongoose = require('mongoose');
const { validateDateRange } = require('../services/calorie.service');

/**
 * Validate that a route parameter is a valid MongoDB ObjectId.
 * Returns 400 with structured error if invalid.
 */
function validateObjectId(paramName) {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Invalid ${paramName}: "${id}" is not a valid ID.`,
          code: 'INVALID_ID'
        }
      });
    }
    next();
  };
}

/**
 * Validate that the :date route parameter is within the 30-day range.
 */
function validateDateParam(req, res, next) {
  const { date } = req.params;
  const result = validateDateRange(date);
  if (!result.valid) {
    return res.status(400).json({
      success: false,
      error: {
        message: result.message,
        code: 'INVALID_DATE_RANGE'
      }
    });
  }
  next();
}

/**
 * Validate user creation request body.
 */
function validateUserBody(req, res, next) {
  const errors = [];
  const { name, weight, height, gender, dateOfBirth } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('Name is required and must be a non-empty string.');
  }
  if (weight === undefined || typeof weight !== 'number' || weight < 1 || weight > 500) {
    errors.push('Weight must be a number between 1 and 500 kg.');
  }
  if (height === undefined || typeof height !== 'number' || height < 30 || height > 300) {
    errors.push('Height must be a number between 30 and 300 cm.');
  }
  if (!gender || !['male', 'female'].includes(String(gender).toLowerCase())) {
    errors.push('Gender must be "male" or "female".');
  }
  if (!dateOfBirth) {
    errors.push('Date of birth is required.');
  } else {
    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) {
      errors.push('Date of birth must be a valid date.');
    } else if (dob >= new Date()) {
      errors.push('Date of birth must be in the past.');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed.',
        code: 'VALIDATION_ERROR',
        details: errors
      }
    });
  }
  next();
}

/**
 * Validate food entry creation request body.
 */
function validateFoodEntryBody(req, res, next) {
  const errors = [];
  const { foodId, portion, mealType } = req.body;

  if (foodId === undefined || typeof foodId !== 'number') {
    errors.push('foodId is required and must be a number.');
  }
  if (portion === undefined || typeof portion !== 'number' || portion < 0.1) {
    errors.push('Portion must be a number >= 0.1.');
  }
  if (!mealType || !['Breakfast', 'Lunch', 'Dinner', 'Snack'].includes(mealType)) {
    errors.push('mealType must be one of: Breakfast, Lunch, Dinner, Snack.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed.',
        code: 'VALIDATION_ERROR',
        details: errors
      }
    });
  }
  next();
}

/**
 * Validate activity entry creation request body.
 */
function validateActivityEntryBody(req, res, next) {
  const errors = [];
  const { activityId, durationMinutes } = req.body;

  if (!activityId || typeof activityId !== 'string') {
    errors.push('activityId is required and must be a string.');
  }
  if (durationMinutes === undefined || typeof durationMinutes !== 'number' || durationMinutes < 1) {
    errors.push('durationMinutes must be a number >= 1.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed.',
        code: 'VALIDATION_ERROR',
        details: errors
      }
    });
  }
  next();
}

module.exports = {
  validateObjectId,
  validateDateParam,
  validateUserBody,
  validateFoodEntryBody,
  validateActivityEntryBody
};
