/**
 * Calorie Calculation Service
 * 
 * Single source of truth for all assignment formulas.
 * All functions are pure (no side effects, no database access)
 * and independently testable.
 * 
 * Formulas from assignment PDF:
 *   Men's BMR    = 66.4730 + (13.7516 × weight_kg) + (5.0033 × height_cm) − (6.7550 × age_years)
 *   Women's BMR  = 655.0955 + (9.5634 × weight_kg) + (1.8496 × height_cm) − (4.6756 × age_years)
 *   Calories Out = MET × weight_kg × duration_hours
 *   Net Calories = Calories In − BMR − Calories Out
 */

/**
 * Calculate accurate calendar-based age in whole years.
 * Handles birthday boundary cases correctly.
 * 
 * @param {Date|string} dateOfBirth - The person's date of birth
 * @param {Date|string} [asOfDate=today] - The reference date to calculate age as of
 * @returns {number} Age in complete years
 */
function calculateAge(dateOfBirth, asOfDate) {
  const dob = new Date(dateOfBirth);
  const ref = asOfDate ? new Date(asOfDate) : new Date();

  // Work with UTC values to avoid timezone shifts
  const dobYear = dob.getUTCFullYear();
  const dobMonth = dob.getUTCMonth();
  const dobDay = dob.getUTCDate();

  const refYear = ref.getUTCFullYear();
  const refMonth = ref.getUTCMonth();
  const refDay = ref.getUTCDate();

  let age = refYear - dobYear;

  // If the birthday has not yet occurred this year, subtract 1
  if (refMonth < dobMonth || (refMonth === dobMonth && refDay < dobDay)) {
    age--;
  }

  return age;
}

/**
 * Calculate Basal Metabolic Rate using the Harris-Benedict equation.
 * 
 * @param {string} gender - 'male' or 'female'
 * @param {number} weightKg - Weight in kilograms
 * @param {number} heightCm - Height in centimeters
 * @param {number} ageYears - Age in years
 * @returns {number} BMR in calories/day
 */
function calculateBMR(gender, weightKg, heightCm, ageYears) {
  if (gender === 'male') {
    return 66.4730 + (13.7516 * weightKg) + (5.0033 * heightCm) - (6.7550 * ageYears);
  }
  // female
  return 655.0955 + (9.5634 * weightKg) + (1.8496 * heightCm) - (4.6756 * ageYears);
}

/**
 * Calculate calories burned during an activity.
 * 
 * @param {number} metValue - MET value of the activity
 * @param {number} weightKg - User's weight in kilograms
 * @param {number} durationMinutes - Duration in minutes
 * @returns {number} Calories burned
 */
function calculateActivityCalories(metValue, weightKg, durationMinutes) {
  const durationHours = durationMinutes / 60;
  return metValue * weightKg * durationHours;
}

/**
 * Calculate calories consumed from a food entry.
 * Portion is a multiplier of the dataset's listed serving.
 * 
 * @param {number} baseCaloriesPerServing - Calories per serving from the dataset
 * @param {number} portion - Number of servings (multiplier)
 * @returns {number} Total calories consumed
 */
function calculateFoodCalories(baseCaloriesPerServing, portion) {
  return baseCaloriesPerServing * portion;
}

/**
 * Calculate net calories for a day.
 * Net Calories = Calories In − BMR − Calories Out
 * 
 * @param {number} totalCaloriesIn - Sum of all food calories for the day
 * @param {number} bmr - BMR for the user (subtracted once per day)
 * @param {number} totalCaloriesOut - Sum of all activity calories for the day
 * @returns {number} Net calories
 */
function calculateNetCalories(totalCaloriesIn, bmr, totalCaloriesOut) {
  return totalCaloriesIn - bmr - totalCaloriesOut;
}

/**
 * Validate that a date string is within the allowed range:
 * from (today - 30 days) to today inclusive.
 * 
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {{ valid: boolean, message?: string }}
 */
function validateDateRange(dateStr) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) {
    return { valid: false, message: 'Date must be in YYYY-MM-DD format.' };
  }

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Calculate 30 days ago
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const minDateStr = thirtyDaysAgo.toISOString().split('T')[0];

  if (dateStr > todayStr) {
    return { valid: false, message: 'Date cannot be in the future.' };
  }

  if (dateStr < minDateStr) {
    return { valid: false, message: `Date cannot be more than 30 days in the past. Earliest allowed: ${minDateStr}` };
  }

  return { valid: true };
}

module.exports = {
  calculateAge,
  calculateBMR,
  calculateActivityCalories,
  calculateFoodCalories,
  calculateNetCalories,
  validateDateRange
};
