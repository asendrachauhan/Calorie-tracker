const mongoose = require('mongoose');

// Embedded food entry sub-schema with historical snapshot
const foodEntrySchema = new mongoose.Schema({
  foodId: { type: Number, required: true },
  foodName: { type: String, required: true },
  foodGroup: { type: String, required: true },
  servingDescription: { type: String, default: '1 serving' },
  baseCalories: { type: Number, required: true },
  portion: { type: Number, required: true, min: [0.1, 'Portion must be at least 0.1.'] },
  mealType: {
    type: String,
    required: true,
    enum: {
      values: ['Breakfast', 'Lunch', 'Dinner', 'Snack'],
      message: 'Meal type must be Breakfast, Lunch, Dinner, or Snack.'
    }
  },
  calculatedCalories: { type: Number, required: true }
}, { _id: true });

// Embedded activity entry sub-schema with historical snapshot
const activityEntrySchema = new mongoose.Schema({
  activityId: { type: String, required: true },
  activityName: { type: String, required: true },
  specificMotion: { type: String, required: true },
  metValue: { type: Number, required: true },
  userWeightKg: { type: Number, required: true },
  durationMinutes: { type: Number, required: true, min: [1, 'Duration must be at least 1 minute.'] },
  calculatedCaloriesBurned: { type: Number, required: true }
}, { _id: true });

const dailyRecordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required.'],
    index: true
  },
  date: {
    type: String,
    required: [true, 'Date is required.'],
    match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format.'],
    index: true
  },
  bmr: {
    type: Number,
    required: true
  },
  foodEntries: [foodEntrySchema],
  activityEntries: [activityEntrySchema]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Unique compound index: one record per user per day
dailyRecordSchema.index({ userId: 1, date: 1 }, { unique: true });
dailyRecordSchema.index({ userId: 1, date: -1 });

/**
 * Virtual: totalCaloriesIn - sum of all food entry calories
 */
dailyRecordSchema.virtual('totalCaloriesIn').get(function () {
  return this.foodEntries.reduce((sum, entry) => sum + entry.calculatedCalories, 0);
});

/**
 * Virtual: totalCaloriesOut - sum of all activity entry calories burned
 */
dailyRecordSchema.virtual('totalCaloriesOut').get(function () {
  return this.activityEntries.reduce((sum, entry) => sum + entry.calculatedCaloriesBurned, 0);
});

/**
 * Virtual: netCalories - Net Calories = Calories In − BMR − Calories Out
 */
dailyRecordSchema.virtual('netCalories').get(function () {
  return this.totalCaloriesIn - this.bmr - this.totalCaloriesOut;
});

const DailyRecord = mongoose.model('DailyRecord', dailyRecordSchema);

module.exports = DailyRecord;
