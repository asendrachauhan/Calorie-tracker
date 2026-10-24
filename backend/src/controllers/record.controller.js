const User = require('../models/User');
const Food = require('../models/Food');
const Activity = require('../models/Activity');
const DailyRecord = require('../models/DailyRecord');
const {
  calculateFoodCalories,
  calculateActivityCalories,
  calculateAge,
  calculateBMR
} = require('../services/calorie.service');

/**
 * GET /api/users/:userId/records - Get all daily record summaries for a user
 */
async function getUserRecords(req, res, next) {
  try {
    const [user, records] = await Promise.all([
      User.findById(req.params.userId).select('_id').lean(),
      DailyRecord.find({ userId: req.params.userId }).sort({ date: -1 })
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found.', code: 'NOT_FOUND' }
      });
    }

    res.json({ success: true, data: records.map(r => r.toJSON ? r.toJSON() : r) });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/users/:userId/records/:date - Get a single daily record
 */
async function getRecordByDate(req, res, next) {
  try {
    const [user, record] = await Promise.all([
      User.findById(req.params.userId),
      DailyRecord.findOne({
        userId: req.params.userId,
        date: req.params.date
      })
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found.', code: 'NOT_FOUND' }
      });
    }

    if (!record) {
      // Return empty record structure for dates with no entries
      const age = calculateAge(user.dateOfBirth, req.params.date);
      const bmr = calculateBMR(user.gender, user.weight, user.height, age);
      return res.json({
        success: true,
        data: {
          userId: user._id,
          date: req.params.date,
          bmr,
          foodEntries: [],
          activityEntries: [],
          totalCaloriesIn: 0,
          totalCaloriesOut: 0,
          netCalories: 0 - bmr
        }
      });
    }

    res.json({ success: true, data: record.toJSON() });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/users/:userId/records/:date/foods - Add a food entry
 */
async function addFoodEntry(req, res, next) {
  try {
    const { foodId, portion, mealType } = req.body;
    const date = req.params.date;

    const [user, food] = await Promise.all([
      User.findById(req.params.userId).select('gender weight height dateOfBirth').lean(),
      Food.findOne({ foodId }).lean()
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found.', code: 'NOT_FOUND' }
      });
    }

    if (!food) {
      return res.status(404).json({
        success: false,
        error: { message: `Food with ID ${foodId} not found.`, code: 'NOT_FOUND' }
      });
    }

    const calculatedCalories = calculateFoodCalories(food.calories, portion);
    const age = calculateAge(user.dateOfBirth, date);
    const bmr = calculateBMR(user.gender, user.weight, user.height, age);

    const foodEntry = {
      foodId: food.foodId,
      foodName: food.name,
      foodGroup: food.foodGroup,
      servingDescription: food.servingDescription,
      baseCalories: food.calories,
      portion,
      mealType,
      calculatedCalories
    };

    // Upsert: create daily record if it doesn't exist, otherwise push entry
    const record = await DailyRecord.findOneAndUpdate(
      { userId: user._id, date },
      {
        $setOnInsert: { userId: user._id, date, bmr },
        $push: { foodEntries: foodEntry }
      },
      { upsert: true, new: true, runValidators: true }
    );

    const recordObj = record.toJSON();
    res.status(201).json({ success: true, data: recordObj });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        error: { message: 'Concurrent record conflict. Please retry.', code: 'CONFLICT' }
      });
    }
    next(err);
  }
}

/**
 * DELETE /api/users/:userId/records/:date/foods/:entryId - Remove a food entry
 */
async function removeFoodEntry(req, res, next) {
  try {
    const record = await DailyRecord.findOneAndUpdate(
      { userId: req.params.userId, date: req.params.date },
      { $pull: { foodEntries: { _id: req.params.entryId } } },
      { new: true }
    );

    if (!record) {
      return res.status(404).json({
        success: false,
        error: { message: 'Daily record not found.', code: 'NOT_FOUND' }
      });
    }

    res.json({ success: true, data: record.toJSON() });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/users/:userId/records/:date/activities - Add an activity entry
 */
async function addActivityEntry(req, res, next) {
  try {
    const { activityId, durationMinutes } = req.body;
    const date = req.params.date;

    const [user, activity] = await Promise.all([
      User.findById(req.params.userId).select('gender weight height dateOfBirth').lean(),
      Activity.findOne({ activityId }).lean()
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found.', code: 'NOT_FOUND' }
      });
    }

    if (!activity) {
      return res.status(404).json({
        success: false,
        error: { message: `Activity with ID ${activityId} not found.`, code: 'NOT_FOUND' }
      });
    }

    const calculatedCaloriesBurned = calculateActivityCalories(
      activity.metValue, user.weight, durationMinutes
    );
    const age = calculateAge(user.dateOfBirth, date);
    const bmr = calculateBMR(user.gender, user.weight, user.height, age);

    const activityEntry = {
      activityId: activity.activityId,
      activityName: activity.activityName,
      specificMotion: activity.specificMotion,
      metValue: activity.metValue,
      userWeightKg: user.weight,
      durationMinutes,
      calculatedCaloriesBurned
    };

    const record = await DailyRecord.findOneAndUpdate(
      { userId: user._id, date },
      {
        $setOnInsert: { userId: user._id, date, bmr },
        $push: { activityEntries: activityEntry }
      },
      { upsert: true, new: true, runValidators: true }
    );

    const recordObj = record.toJSON();
    res.status(201).json({ success: true, data: recordObj });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        error: { message: 'Concurrent record conflict. Please retry.', code: 'CONFLICT' }
      });
    }
    next(err);
  }
}

/**
 * DELETE /api/users/:userId/records/:date/activities/:entryId - Remove an activity entry
 */
async function removeActivityEntry(req, res, next) {
  try {
    const record = await DailyRecord.findOneAndUpdate(
      { userId: req.params.userId, date: req.params.date },
      { $pull: { activityEntries: { _id: req.params.entryId } } },
      { new: true }
    );

    if (!record) {
      return res.status(404).json({
        success: false,
        error: { message: 'Daily record not found.', code: 'NOT_FOUND' }
      });
    }

    res.json({ success: true, data: record.toJSON() });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getUserRecords,
  getRecordByDate,
  addFoodEntry,
  removeFoodEntry,
  addActivityEntry,
  removeActivityEntry
};
