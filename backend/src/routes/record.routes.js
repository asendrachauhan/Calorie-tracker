const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getUserRecords,
  getRecordByDate,
  addFoodEntry,
  removeFoodEntry,
  addActivityEntry,
  removeActivityEntry
} = require('../controllers/record.controller');
const {
  validateObjectId,
  validateDateParam,
  validateFoodEntryBody,
  validateActivityEntryBody
} = require('../middleware/validator.middleware');

// All routes are nested under /api/users/:userId/records
router.get('/', getUserRecords);
router.get('/:date', validateDateParam, getRecordByDate);

// Food entries
router.post('/:date/foods', validateDateParam, validateFoodEntryBody, addFoodEntry);
router.delete('/:date/foods/:entryId', validateDateParam, removeFoodEntry);

// Activity entries
router.post('/:date/activities', validateDateParam, validateActivityEntryBody, addActivityEntry);
router.delete('/:date/activities/:entryId', validateDateParam, removeActivityEntry);

module.exports = router;
